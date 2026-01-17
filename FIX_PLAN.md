# Fix Plan: Explore, Map, and File Upload Integration

## Overview
This document outlines the plan to fix three critical integration issues:
1. Connect Explore feature with Chat (tool calling & recommendations)
2. Connect Map feature with Chat (location-based recommendations)
3. Fix Camera/File Upload functionality in Chat

---

## Issue 1: Explore Feature ↔ Chat Integration

### Current State
- Explore is displayed as an iframe in chat view (`ChatInterface.tsx` line 569-577)
- Chat has no way to search or access explore content
- No tool calling system for explore recommendations
- Products/content exist in Firestore but chat can't discover them

### Required Changes

#### 1.1 Add Tool Calling Infrastructure
**Files to modify:**
- `app/api/llm/openai/route.ts` - Add tools parameter support
- `app/api/llm/anthropic/route.ts` - Add tools parameter support  
- `app/api/llm/gemini/route.ts` - Add tools parameter support
- `lib/models/llmModels.ts` - Add tool calling handler

**Implementation:**
```typescript
// Add tools parameter to LLM calls
interface LLMTools {
  search_explore: {
    description: "Search the explore feed for products, videos, and content",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        filter: { type: "string", enum: ["for-you", "products", "videos", "trending"] },
        maxResults: { type: "number", default: 10 }
      }
    }
  },
  get_product_details: {
    description: "Get detailed information about a specific product",
    parameters: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Product ID" }
      }
    }
  }
}
```

#### 1.2 Create Explore Tool API Endpoint
**New file:** `app/api/tools/explore/route.ts`
```typescript
// Handle tool calls for explore search
export async function POST(req: NextRequest) {
  const { tool, parameters } = await req.json();
  
  if (tool === "search_explore") {
    // Call /api/explore/feed with parameters
    // Return formatted results for LLM
  }
  
  if (tool === "get_product_details") {
    // Fetch product from Firestore
    // Return detailed product info
  }
}
```

#### 1.3 Update Chat Context to Handle Tool Calls
**Files to modify:**
- `contexts/ChatContext.tsx` - Add tool calling state
- `components/viim/NeuralBox.tsx` - Process tool calls in LLM responses

**Flow:**
1. User asks: "Show me good Notion templates under $15"
2. LLM detects product query → calls `search_explore` tool
3. Tool returns product results
4. LLM formats response with product cards
5. UI displays inline product cards

#### 1.4 Add Product Recommendation UI
**Files to modify:**
- `components/chat/ChatMessage.tsx` - Display product cards in chat
- `components/commerce/InlineProductCard.tsx` - Already exists, integrate

**Integration points:**
- When LLM response contains product references, render `InlineProductCard`
- Add "Ask +AI" button to product cards
- Pre-fill chat with product context when clicked

---

## Issue 2: Map Feature ↔ Chat Integration

### Current State
- Map view has NeuralBox at bottom but it's isolated (`MapView.tsx` line 148-159)
- Chat doesn't know user's location
- Chat can't query nearby content
- Map API exists (`/api/map/nearby`) but chat doesn't use it

### Required Changes

#### 2.1 Pass Location Context to Chat
**Files to modify:**
- `components/map/MapView.tsx` - Share location state with NeuralBox
- `components/viim/NeuralBox.tsx` - Accept location prop
- `contexts/ChatContext.tsx` - Store location context

**Implementation:**
```typescript
// In MapView.tsx
<NeuralBox
  location={userLocation}
  locationContext="map"
  // ... other props
/>

// In NeuralBox.tsx
interface NeuralBoxProps {
  // ... existing props
  location?: { lat: number; lng: number };
  locationContext?: "map" | "chat";
}
```

#### 2.2 Add Location-Based Tool Calling
**New tool:** `search_nearby`
```typescript
search_nearby: {
  description: "Find content, products, or places near the user's location",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["product", "video", "all"] },
      radius: { type: "number", default: 5 }, // miles
      keywords: { type: "string" }
    }
  }
}
```

#### 2.3 Create Map Tool API Endpoint
**New file:** `app/api/tools/map/route.ts`
```typescript
export async function POST(req: NextRequest) {
  const { tool, parameters, location } = await req.json();
  
  if (tool === "search_nearby") {
    // Call /api/map/nearby with location + parameters
    // Return formatted results
  }
}
```

#### 2.4 Update Chat to Use Location Tools
**Files to modify:**
- `components/viim/NeuralBox.tsx` - Include location in tool calls
- `lib/models/llmModels.ts` - Pass location context to LLM

**Flow:**
1. User in map view asks: "What's good to eat nearby?"
2. Chat detects location context → includes location in tool call
3. Calls `search_nearby` tool with location
4. Returns nearby restaurants/products
5. LLM formats response with location-aware recommendations

#### 2.5 Add Map Markers from Chat Recommendations
**Files to modify:**
- `components/map/MapView.tsx` - Add markers for recommended content
- Update markers when chat provides location-based results

---

## Issue 3: Camera/File Upload Not Working

### Current State
- Camera button exists but is disabled (`NeuralBox.tsx` line 1639-1645)
- Image button exists but is disabled (`NeuralBox.tsx` line 1646-1652)
- No file input handler
- No file upload to Firebase Storage
- No image attachment to messages

### Required Changes

#### 3.1 Enable File Input
**Files to modify:**
- `components/viim/NeuralBox.tsx` - Add file input handler

**Implementation:**
```typescript
// Add hidden file input
const fileInputRef = useRef<HTMLInputElement>(null);

const handleCameraClick = () => {
  // For mobile: use Capacitor Camera
  // For web: trigger file input with camera capture
  fileInputRef.current?.click();
};

const handleImageClick = () => {
  // Trigger file input for image selection
  fileInputRef.current?.setAttribute('accept', 'image/*');
  fileInputRef.current?.click();
};

// Add file input
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,video/*"
  multiple={false}
  onChange={handleFileSelect}
  className="hidden"
/>
```

#### 3.2 Add File Upload Handler
**Files to modify:**
- `components/viim/NeuralBox.tsx` - Add upload function
- `lib/media/imageUpload.ts` - Create if doesn't exist
- `lib/media/videoUpload.ts` - Create if doesn't exist

**Implementation:**
```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  setIsUploading(true);
  
  try {
    // Upload to Firebase Storage
    const storageRef = ref(storage, `chat/${currentUser.uid}/${nanoid()}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Add to message with file reference
    await appendMessageToConversation("user", "", {
      fileRefs: [{
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: downloadURL,
        thumbnail: file.type.startsWith('image/') ? downloadURL : undefined
      }]
    });
    
    // Send to LLM with image context
    await handleLLMRequestWithImage(selectedModel, downloadURL, file.type);
    
  } catch (error) {
    console.error('Upload failed:', error);
    // Show error message
  } finally {
    setIsUploading(false);
  }
};
```

#### 3.3 Add Vision Model Support
**Files to modify:**
- `app/api/llm/openai/route.ts` - Add vision model support (gpt-4o, gpt-4-vision)
- `lib/models/llmModels.ts` - Handle image inputs

**Implementation:**
```typescript
// In OpenAI route
if (imageUrl) {
  messages.push({
    role: "user",
    content: [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageUrl } }
    ]
  });
}
```

#### 3.4 Display Images in Chat
**Files to modify:**
- `components/chat/ChatMessage.tsx` - Display image attachments
- `components/media/ImageGallery.tsx` - Use existing component

**Implementation:**
```typescript
// In ChatMessage.tsx
{message.fileRefs?.map((fileRef, idx) => (
  fileRef.type === 'image' ? (
    <img
      key={idx}
      src={fileRef.url}
      alt="Uploaded image"
      className="max-w-md rounded-lg"
    />
  ) : (
    <video src={fileRef.url} controls className="max-w-md rounded-lg" />
  )
))}
```

#### 3.5 Add Capacitor Camera Integration (Mobile)
**Files to modify:**
- `components/viim/NeuralBox.tsx` - Detect platform, use Capacitor Camera on mobile

**Implementation:**
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const handleCameraClick = async () => {
  if (Capacitor.isNativePlatform()) {
    // Use Capacitor Camera
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri
    });
    
    // Convert to blob and upload
    const response = await fetch(image.webPath!);
    const blob = await response.blob();
    await handleFileUpload(blob);
  } else {
    // Web: trigger file input
    fileInputRef.current?.click();
  }
};
```

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ **File Upload** - Enable camera/image buttons, basic upload
2. ✅ **Explore Tool Calling** - Basic search_explore tool
3. ✅ **Map Location Context** - Pass location to chat

### Phase 2: Important (Week 2)
4. ✅ **Product Recommendations** - Inline product cards in chat
5. ✅ **Map Tool Calling** - search_nearby tool
6. ✅ **Vision Model Support** - Image analysis in chat

### Phase 3: Enhancement (Week 3)
7. ✅ **Advanced Tool Calling** - Multiple tools, tool chaining
8. ✅ **Map Markers from Chat** - Visual feedback
9. ✅ **Capacitor Camera** - Native mobile support

---

## Testing Checklist

### Explore Integration
- [ ] Chat can search explore feed via tool calling
- [ ] Product recommendations appear in chat
- [ ] "Ask +AI" button works on product cards
- [ ] Chat context includes product details when asking about products

### Map Integration
- [ ] Chat receives location when in map view
- [ ] Chat can query nearby content
- [ ] Location-based recommendations work
- [ ] Map markers update based on chat recommendations

### File Upload
- [ ] Camera button opens camera/file picker
- [ ] Image button opens image picker
- [ ] Files upload to Firebase Storage
- [ ] Images display in chat messages
- [ ] Vision models can analyze uploaded images
- [ ] Mobile camera works via Capacitor

---

## Files to Create/Modify

### New Files
1. `app/api/tools/explore/route.ts` - Explore tool handler
2. `app/api/tools/map/route.ts` - Map tool handler
3. `lib/media/imageUpload.ts` - Image upload utility (if doesn't exist)
4. `lib/tools/toolRegistry.ts` - Tool definitions and registry

### Modified Files
1. `components/viim/NeuralBox.tsx` - File upload, tool calling, location prop
2. `components/map/MapView.tsx` - Pass location to NeuralBox
3. `components/chat/ChatMessage.tsx` - Display images, product cards
4. `contexts/ChatContext.tsx` - Tool calling state, location context
5. `app/api/llm/openai/route.ts` - Tools parameter, vision support
6. `app/api/llm/anthropic/route.ts` - Tools parameter
7. `app/api/llm/gemini/route.ts` - Tools parameter, vision support
8. `lib/models/llmModels.ts` - Tool calling handler
9. `components/chat/ChatInterface.tsx` - Explore integration (if needed)

---

## Technical Notes

### Tool Calling Format
Use OpenAI-compatible tool calling format for consistency:
```typescript
{
  tools: [{
    type: "function",
    function: {
      name: "search_explore",
      description: "...",
      parameters: { ... }
    }
  }]
}
```

### Location Privacy
- Only share location when user is in map view
- Don't store location in conversation history
- Clear location context when leaving map view

### File Upload Limits
- Max image size: 10MB
- Max video size: 50MB
- Supported formats: jpg, png, gif, webp, mp4, mov
- Compress images before upload

### Error Handling
- Handle tool call failures gracefully
- Show user-friendly error messages
- Fallback to text-only responses if tools fail
- Log tool usage for debugging

---

## Success Criteria

✅ **Explore Integration:**
- User can ask "show me products under $20" and get results
- Product cards appear inline in chat
- Chat can answer questions about specific products

✅ **Map Integration:**
- User in map view can ask "what's nearby?" and get location-based results
- Chat recommendations include location context
- Map shows markers for recommended places

✅ **File Upload:**
- Camera button opens camera/file picker
- Images upload and display in chat
- Chat can analyze uploaded images
- Works on both web and mobile

---

**Last Updated:** [Current Date]  
**Status:** Ready for Implementation

