/**
 * Tool Executor - Executes tool calls from LLM responses
 */

interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

interface ToolResult {
  tool_call_id: string;
  name: string;
  result: any;
}

export async function executeToolCall(
  toolCall: ToolCall,
  location?: { lat: number; lng: number } | null
): Promise<ToolResult> {
  try {
    // Handle different tool call structures
    let args: any = {};
    if (toolCall.arguments) {
      try {
        args = typeof toolCall.arguments === 'string' 
          ? JSON.parse(toolCall.arguments) 
          : toolCall.arguments;
      } catch (e) {
        console.error('Error parsing tool arguments:', e);
        args = {};
      }
    }
    
    // Handle OpenAI tool call structure (function.name, function.arguments)
    const toolName = (toolCall as any).function?.name || toolCall.name;
    const toolArgs = (toolCall as any).function?.arguments 
      ? (typeof (toolCall as any).function.arguments === 'string' 
          ? JSON.parse((toolCall as any).function.arguments) 
          : (toolCall as any).function.arguments)
      : args;
    
    let result: any;
    
    if (toolName === "search_explore" || toolName === "get_product_details") {
      // Execute explore tools
      const response = await fetch("/api/tools/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolName, parameters: toolArgs }),
      });
      
      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }
      
      result = await response.json();
    } else if (toolName === "search_nearby") {
      // Execute map tools with location
      if (!location) {
        throw new Error("Location required for search_nearby tool");
      }
      
      const response = await fetch("/api/tools/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tool: toolName, 
          parameters: toolArgs,
          location 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }
      
      result = await response.json();
    } else {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    const toolCallId = (toolCall as any).id || toolCall.id || 'unknown';
    
    return {
      tool_call_id: toolCallId,
      name: toolName,
      result: result,
    };
  } catch (error) {
    const toolName = (toolCall as any).function?.name || toolCall.name || 'unknown';
    const toolCallId = (toolCall as any).id || toolCall.id || 'unknown';
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      tool_call_id: toolCallId,
      name: toolName,
      result: { error: error instanceof Error ? error.message : "Tool execution failed" },
    };
  }
}

export async function executeToolCalls(
  toolCalls: ToolCall[],
  location?: { lat: number; lng: number } | null
): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(toolCall => executeToolCall(toolCall, location))
  );
}

