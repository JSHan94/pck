import {
	claimPrizeWithSecret,
	collectFee,
	collectPrize,
	createLottery,
	getLottery,
	listLotteries,
	pickSlot,
} from "../../mocks/lotteryMock"

export type LotterySummary = {
	id: string
	isActive: boolean
	slotCount: number
	slots: boolean[]
	winningSlot: number
	winner: string | null
	creator: string
	prize: string
	prizeMist: number
	prizeValue: number
	fee: string
	feeMist: number
	feeValue: number
	remainingFee: string
	remainingFeeMist: number
	prizeClaimed: boolean
	createdAt: string
	createdAtMs: number
	coverImage: string
}

export const fetchLotteryDetail = async (id: string): Promise<LotterySummary | null> => {
	return getLottery(id)
}

export const fetchAllLotteries = async (
	_page: number,
	_pageSize: number
): Promise<{ data: LotterySummary[]; total: number }> => {
	return listLotteries(_page, _pageSize)
}

export const createLotteryMock = (creator: string, prizeMist: number, feeMist: number) =>
	createLottery(creator, prizeMist, feeMist)

export const pickSlotMock = (id: string, slotIndex: number, player: string) =>
	pickSlot(id, slotIndex, player)

export const collectFeeMock = (id: string, creator: string) => collectFee(id, creator)

export const collectPrizeMock = (id: string, winner: string) => collectPrize(id, winner)

export const claimPrizeWithSecretMock = (id: string) => claimPrizeWithSecret(id)
