import { DEFAULT_FEE, DEFAULT_LOTTERY_PRIZE, SLOT_COUNT, mistToSui } from "../config/constants"

export type LotteryRecord = {
	id: string
	slots: boolean[]
	winningSlot: number
	winner: string | null
	creator: string
	prize: number
	remainingFee: number
	prizeClaimed: boolean
	fee: number
	createdAtMs: number
}

const lotteries = new Map<string, LotteryRecord>()

const randomHex = (length: number = 64) => {
	return '0x' + Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

const seedLotteries = () => {
	if (lotteries.size > 0) return
	const now = Date.now()
	const base: LotteryRecord[] = [
		{
			id: "0x8f3c2b1a9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
			slots: [true, false, false, false, true, false, false, false, false],
			winningSlot: 4,
			winner: null,
			creator: "0x71c95911e9a5d330f428915e061b36c1d61d6325",
			prize: DEFAULT_LOTTERY_PRIZE,
			remainingFee: DEFAULT_FEE * 2,
			prizeClaimed: false,
			fee: DEFAULT_FEE,
			createdAtMs: now - 1000 * 60 * 60 * 4,
		},
		{
			id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
			slots: Array(SLOT_COUNT).fill(false),
			winningSlot: 2,
			winner: null,
			creator: "0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a210987",
			prize: DEFAULT_LOTTERY_PRIZE * 2,
			remainingFee: DEFAULT_FEE * 3,
			prizeClaimed: false,
			fee: DEFAULT_FEE,
			createdAtMs: now - 1000 * 60 * 24,
		},
	]
	base.forEach((l) => lotteries.set(l.id, l))
}

seedLotteries()

const toSummary = (record: LotteryRecord) => ({
	id: record.id,
	isActive: record.winner === null,
	slotCount: record.slots.length,
	slots: [...record.slots],
	winningSlot: record.winningSlot,
	winner: record.winner,
	creator: record.creator,
	prize: mistToSui(record.prize),
	prizeMist: record.prize,
	prizeValue: Number(mistToSui(record.prize)),
	fee: mistToSui(record.fee),
	feeMist: record.fee,
	feeValue: Number(mistToSui(record.fee)),
	remainingFee: mistToSui(record.remainingFee),
	remainingFeeMist: record.remainingFee,
	prizeClaimed: record.prizeClaimed,
	createdAt: new Date(record.createdAtMs).toLocaleDateString(),
	createdAtMs: record.createdAtMs,
	coverImage: "",
})

export const listLotteries = (page: number, pageSize: number) => {
	const all = Array.from(lotteries.values()).sort((a, b) => b.createdAtMs - a.createdAtMs)
	const total = all.length
	const start = (page - 1) * pageSize
	const pageItems = all.slice(start, start + pageSize)
	return { data: pageItems.map(toSummary), total }
}

export const getLottery = (id: string) => {
	const rec = lotteries.get(id)
	return rec ? toSummary(rec) : null
}

export const createLottery = (creator: string, prize: number, fee: number) => {
	const id = randomHex(40)
	const winningSlot = Math.floor(Math.random() * SLOT_COUNT)
	const record: LotteryRecord = {
		id,
		slots: Array(SLOT_COUNT).fill(false),
		winningSlot,
		winner: null,
		creator,
		prize,
		remainingFee: fee * Math.ceil(SLOT_COUNT / 3),
		prizeClaimed: false,
		fee,
		createdAtMs: Date.now(),
	}
	lotteries.set(id, record)
	return toSummary(record)
}

export const pickSlot = (id: string, slotIndex: number, player: string) => {
	const rec = lotteries.get(id)
	if (!rec) throw new Error("Lottery not found")
	if (slotIndex < 0 || slotIndex >= rec.slots.length) throw new Error("Invalid slot")
	if (rec.slots[slotIndex]) throw new Error("Slot already taken")

	rec.slots[slotIndex] = true
	rec.remainingFee = Math.max(rec.remainingFee - rec.fee, 0)
	if (slotIndex === rec.winningSlot) {
		rec.winner = player
	}
	return toSummary(rec)
}

export const collectFee = (id: string, collector: string) => {
	const rec = lotteries.get(id)
	if (!rec) throw new Error("Lottery not found")
	if (collector !== rec.creator) throw new Error("Only creator can collect fee")
	rec.remainingFee = 0
	return toSummary(rec)
}

export const collectPrize = (id: string, winner: string) => {
	const rec = lotteries.get(id)
	if (!rec) throw new Error("Lottery not found")
	if (rec.winner !== winner) throw new Error("Only winner can collect prize")
	rec.prize = 0
	rec.prizeClaimed = true
	return toSummary(rec)
}

export const claimPrizeWithSecret = (id: string) => {
	const rec = lotteries.get(id)
	if (!rec) throw new Error("Lottery not found")
	rec.prize = 0
	rec.prizeClaimed = true
	if (!rec.winner) {
		rec.winner = "0x0000000000000000000000000000000000000000"
	}
	return toSummary(rec)
}
