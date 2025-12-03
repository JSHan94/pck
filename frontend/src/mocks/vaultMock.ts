
export interface VaultState {
    lockedM: number;
    userPmBalance: number;
}

let vaultState: VaultState = {
    lockedM: 0,
    userPmBalance: 0,
};

export const getVaultState = async (): Promise<VaultState> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ...vaultState };
};

export const BALANCE_UPDATED_EVENT = "pmBalanceUpdated";

const dispatchUpdate = () => {
    window.dispatchEvent(new Event(BALANCE_UPDATED_EVENT));
};

export const lockAndMint = async (amount: number): Promise<VaultState> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    vaultState.lockedM += amount;
    vaultState.userPmBalance += amount;
    dispatchUpdate();
    return { ...vaultState };
};

export const burnAndWithdraw = async (amount: number): Promise<VaultState> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (vaultState.userPmBalance < amount) {
        throw new Error("Insufficient $pM balance");
    }
    vaultState.lockedM -= amount;
    vaultState.userPmBalance -= amount;
    dispatchUpdate();
    return { ...vaultState };
};

export const deductPm = (amount: number) => {
    if (vaultState.userPmBalance < amount) {
        throw new Error("Insufficient $pM balance");
    }
    vaultState.userPmBalance -= amount;
    dispatchUpdate();
};

export const addPm = (amount: number) => {
    vaultState.userPmBalance += amount;
    dispatchUpdate();
};
