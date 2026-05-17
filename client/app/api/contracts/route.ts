import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get("network") || "preprod";

    const contracts = await prisma.vaultContract.findMany({
      where: { networkId: network },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contracts });
  } catch (err) {
    console.error("[api/contracts] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { networkId, vaultKeeperAddress, vkprTokenAddress, ownerKey, name } = body;

    if (!networkId || !vaultKeeperAddress || !ownerKey) {
      return NextResponse.json({ error: "Missing required fields: networkId, vaultKeeperAddress, ownerKey" }, { status: 400 });
    }

    const contract = await prisma.vaultContract.create({
      data: {
        networkId,
        vaultKeeperAddress,
        vkprTokenAddress: vkprTokenAddress || "",
        ownerKey,
        name: name || "Untitled Vault",
      },
    });
    return NextResponse.json({ success: true, id: contract.id });
  } catch (err) {
    console.error("[api/contracts] POST error:", err);
    return NextResponse.json({ error: "Failed to save contract" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { vaultKeeperAddress, vkprTokenAddress } = body;

    if (!vaultKeeperAddress || !vkprTokenAddress) {
      return NextResponse.json({ error: "Missing vaultKeeperAddress or vkprTokenAddress" }, { status: 400 });
    }

    const contract = await prisma.vaultContract.update({
      where: { vaultKeeperAddress },
      data: { vkprTokenAddress },
    });
    return NextResponse.json({ success: true, id: contract.id });
  } catch (err) {
    console.error("[api/contracts] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}
