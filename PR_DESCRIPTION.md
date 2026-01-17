# Integrate Explore, Map, and File Upload with Chat

## Summary
This PR integrates three critical features with the chat system:
1. **File Upload** - Camera/image upload functionality
2. **Explore Integration** - Product/content search and recommendations
3. **Map Integration** - Location-based recommendations

## Changes

### File Upload Features
- ✅ Enabled camera and image buttons in NeuralBox
- ✅ Added file input handlers for camera and image selection
- ✅ Implemented Firebase Storage upload for images/videos
- ✅ Added image display in chat messages
- ✅ Added vision model support (GPT-4o, Gemini) for image analysis

### Explore Integration
- ✅ Created tool registry with `search_explore` and `get_product_details` tools
- ✅ Added `/api/tools/explore` endpoint for tool execution
- ✅ Implemented tool calling infrastructure in LLM routes
- ✅ Added product card rendering in chat when tools return results

### Map Integration
- ✅ Pass location context from MapView to NeuralBox
- ✅ Created `search_nearby` tool for location-based queries
- ✅ Added `/api/tools/map` endpoint for location-based tool execution
- ✅ Added map markers for content recommended by chat

### Enhancements
- ✅ Implemented tool call execution in streaming responses
- ✅ Display inline product cards when LLM recommends products
- ✅ Update map with markers for recommended nearby content
- ✅ Added tool executor utility for handling tool calls

## Files Changed
- `components/viim/NeuralBox.tsx` - File upload, tool calling, location support
- `components/map/MapView.tsx` - Location passing, marker display
- `app/api/llm/openai/route.ts` - Tools parameter, vision support
- `app/api/llm/gemini/route.ts` - Vision support
- `lib/models/llmModels.ts` - Tool support in LLM functions
- `app/api/tools/explore/route.ts` - New tool execution endpoint
- `app/api/tools/map/route.ts` - New map tool execution endpoint
- `lib/tools/toolRegistry.ts` - Tool definitions
- `lib/tools/toolExecutor.ts` - Tool execution utility

## Testing Checklist
- [ ] Camera button opens file picker
- [ ] Image button opens file picker
- [ ] Files upload to Firebase Storage
- [ ] Images display in chat messages
- [ ] Vision models analyze uploaded images
- [ ] Chat can search explore feed via tool calling
- [ ] Product recommendations appear in chat
- [ ] Product cards display inline
- [ ] Chat receives location in map view
- [ ] Location-based queries work
- [ ] Map markers update from chat recommendations

## Breaking Changes
None - all changes are additive.

## Related Issues
Fixes:
- Camera button not working
- File upload to chat not working
- Explore feature not connected with chat
- Map feature not connected with chat

