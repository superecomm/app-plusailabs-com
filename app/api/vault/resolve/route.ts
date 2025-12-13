import { NextRequest, NextResponse } from "next/server";
import type { VaultRef } from "@/types/conversation";
import { getVaultBio, listVaultFiles } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, vaultRefs, budget } = body;

    if (!userId || !vaultRefs || typeof budget !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const items: Array<{ source: string; content: string; chars: number }> = [];
    let totalChars = 0;

    for (const ref of vaultRefs as VaultRef[]) {
      if (totalChars >= budget) break;

      try {
        let content = "";

        switch (ref.type) {
          case "bio": {
            const bio = await getVaultBio(userId);
            content = bio.content || "";
            break;
          }

          case "folder": {
            const files = await listVaultFiles(userId, ref.id);
            content = files
              .map(f => `File: ${f.name}\n(File content placeholder)`)
              .join("\n\n");
            break;
          }

          case "file": {
            content = `File content for ${ref.name} (to be implemented)`;
            break;
          }
        }

        if (!content) continue;

        const remainingBudget = budget - totalChars;
        const truncatedContent = content.length <= remainingBudget 
          ? content 
          : content.slice(0, remainingBudget - 3) + '...';

        items.push({
          source: ref.name,
          content: truncatedContent,
          chars: truncatedContent.length,
        });

        totalChars += truncatedContent.length;
      } catch (error) {
        console.error(`Failed to resolve vault ref ${ref.id}:`, error);
        continue;
      }
    }

    return NextResponse.json({
      items,
      totalChars,
      exceeded: totalChars >= budget,
    });
  } catch (error) {
    console.error("POST /api/vault/resolve error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

