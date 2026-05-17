-- CreateTable
CREATE TABLE "vault_contracts" (
    "id" SERIAL NOT NULL,
    "network_id" TEXT NOT NULL,
    "vault_keeper_address" TEXT NOT NULL,
    "vkpr_token_address" TEXT NOT NULL DEFAULT '',
    "owner_key" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled Vault',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vault_contracts_vault_keeper_address_key" ON "vault_contracts"("vault_keeper_address");
