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
    const args = JSON.parse(toolCall.arguments);
    
    let result: any;
    
    if (toolCall.name === "search_explore" || toolCall.name === "get_product_details") {
      // Execute explore tools
      const response = await fetch("/api/tools/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolCall.name, parameters: args }),
      });
      
      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }
      
      result = await response.json();
    } else if (toolCall.name === "search_nearby") {
      // Execute map tools with location
      if (!location) {
        throw new Error("Location required for search_nearby tool");
      }
      
      const response = await fetch("/api/tools/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tool: toolCall.name, 
          parameters: args,
          location 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }
      
      result = await response.json();
    } else {
      throw new Error(`Unknown tool: ${toolCall.name}`);
    }
    
    return {
      tool_call_id: toolCall.id,
      name: toolCall.name,
      result: result,
    };
  } catch (error) {
    console.error(`Error executing tool ${toolCall.name}:`, error);
    return {
      tool_call_id: toolCall.id,
      name: toolCall.name,
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

