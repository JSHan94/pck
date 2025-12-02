import { DEFAULT_FEE, DEFAULT_LOTTERY_PRIZE, PACKAGE_ID, SLOT_COUNT } from "../config/constants"

type LotteryState = {
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

type RecordedEvent = {
	id: string
	type: string
	timestampMs: number
	parsedJson?: Record<string, any>
}

type RecordedTx = {
	digest: string
	events?: RecordedEvent[]
	objectChanges?: Array<{
		type: string
		objectType: string
		objectId: string
	}>
}

export type MockTransactionCall = {
	target: string
	arguments: any[]
}

export class Transaction {
	calls: MockTransactionCall[] = []
	gas = { type: "gas" }
	pure = {
		u64: (value: number) => value,
		vector: (_type: string, values: any[]) => values,
		string: (value: string) => value,
	}

	splitCoins(_coin: any, amounts: number[]) {
		return amounts.map((amount) => ({ type: "coin", amount }))
	}

	moveCall(call: MockTransactionCall) {
		this.calls.push(call)
	}

	object(id: string) {
		return id
	}

	setGasBudget(_budget: number) {
		return _budget
	}

	async build() {
		return "mock-built-transaction"
	}
}

const lotteries = new Map<string, LotteryState>()
const events: RecordedEvent[] = []
const txResults = new Map<string, RecordedTx>()


const defaultCreator = "0x71c95911e9a5d330f428915e061b36c1d61d6325"

const randomHex = (length: number = 64) => {
	return '0x' + Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

const seedLotteries = () => {
	if (lotteries.size > 0) return

	const now = Date.now()
	const base: LotteryState[] = [
		{
			id: "0x8f3c2b1a9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
			slots: [true, false, false, false, true, false, false, false, false],
			winningSlot: 4,
			winner: null,
			creator: defaultCreator,
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
			creator: defaultCreator,
			prize: DEFAULT_LOTTERY_PRIZE * 2,
			remainingFee: DEFAULT_FEE * 3,
			prizeClaimed: false,
			fee: DEFAULT_FEE,
			createdAtMs: now - 1000 * 60 * 24,
		},
	]

	base.forEach((lottery) => lotteries.set(lottery.id, lottery))

	base.forEach((lottery) => {
		events.push({
			id: `event-${lottery.id}`,
			type: `${PACKAGE_ID}::random_poc::LotteryCreatedEvent`,
			timestampMs: lottery.createdAtMs,
			parsedJson: { lottery_id: lottery.id },
		})
	})
}

seedLotteries()

const newDigest = () => randomHex(40)

const recordTx = (digest: string, details: Omit<RecordedTx, "digest">) => {
	txResults.set(digest, { digest, ...details })
}

const markWinnerIfNeeded = (lottery: LotteryState, slotIndex: number, player: string | null) => {
	if (lottery.winningSlot === slotIndex) {
		lottery.winner = player ?? "0x0000000000000000000000000000000000000000"
	}
}

const executeCall = (call: MockTransactionCall, sender?: string) => {
	switch (call.target) {
		case `${PACKAGE_ID}::random_poc::create_lottery`: {
			const prize = call.arguments[0]?.amount ?? DEFAULT_LOTTERY_PRIZE
			const fee = Number(call.arguments[1] ?? DEFAULT_FEE)
			const id = randomHex(40)
			const createdAtMs = Date.now()
			const lottery: LotteryState = {
				id,
				slots: Array(SLOT_COUNT).fill(false),
				winningSlot: 0,
				winner: null,
				creator: sender || defaultCreator,
				prize: prize || DEFAULT_LOTTERY_PRIZE,
				remainingFee: fee,
				prizeClaimed: false,
				fee,
				createdAtMs,
			}
			lotteries.set(id, lottery)
			events.push({
				id: `event-${id}`,
				type: `${PACKAGE_ID}::random_poc::LotteryCreatedEvent`,
				timestampMs: createdAtMs,
				parsedJson: { lottery_id: id },
			})
			return {
				events: [
					{
						id: `event-${id}`,
						type: `${PACKAGE_ID}::random_poc::LotteryCreatedEvent`,
						timestampMs: createdAtMs,
						parsedJson: { lottery_id: id },
					},
				],
				objectChanges: [
					{
						type: "created",
						objectType: `${PACKAGE_ID}::random_poc::Lottery`,
						objectId: id,
					},
				],
			}
		}
		case `${PACKAGE_ID}::random_poc::pick_slot`: {
			const slotIndex = Number(call.arguments[0])
			const lotteryId = String(call.arguments[1])
			const lottery = lotteries.get(lotteryId)
			if (!lottery) {
				throw new Error("Lottery not found")
			}
			if (!lottery.slots[slotIndex]) {
				lottery.slots[slotIndex] = true
				lottery.remainingFee = Math.max(lottery.remainingFee - lottery.fee, 0)
				markWinnerIfNeeded(lottery, slotIndex, sender || null)
			}
			const winnerEvent =
				lottery.winner && lottery.winner === (sender || lottery.winner)
					? [
						{
							id: `winner-${lottery.id}-${Date.now()}`,
							type: `${PACKAGE_ID}::random_poc::WinnerClaimInfoEvent`,
							timestampMs: Date.now(),
							parsedJson: { lottery_id: lottery.id, winner: lottery.winner },
						},
					]
					: []

			return { events: winnerEvent }
		}
		case `${PACKAGE_ID}::random_poc::collect_fee`: {
			const lotteryId = String(call.arguments[0])
			const lottery = lotteries.get(lotteryId)
			if (lottery) {
				lottery.remainingFee = 0
			}
			return {}
		}
		case `${PACKAGE_ID}::random_poc::collect_prize`: {
			const lotteryId = String(call.arguments[0])
			const lottery = lotteries.get(lotteryId)
			if (lottery) {
				lottery.prize = 0
			}
			return {}
		}
		case `${PACKAGE_ID}::random_poc::claim_prize_with_secret`: {
			const lotteryId = String(call.arguments[0])
			const lottery = lotteries.get(lotteryId)
			if (lottery) {
				lottery.prize = 0
				lottery.prizeClaimed = true
			}
			return {}
		}
		case `${PACKAGE_ID}::random_poc::create_user_allowlist`: {
			const allowlistId = randomHex(40)
			const capId = randomHex(40)
			return {
				objectChanges: [
					{
						type: "created",
						objectType: `${PACKAGE_ID}::allowlist::Allowlist`,
						objectId: allowlistId,
					},
					{
						type: "created",
						objectType: `${PACKAGE_ID}::allowlist::Cap`,
						objectId: capId,
					},
				],
			}
		}
		default:
			return {}
	}
}

export const chainClient = {
	async getObject({ id }: { id: string; options?: any }) {
		const lottery = lotteries.get(id)
		if (!lottery) {
			return { data: null }
		}
		return {
			data: {
				content: {
					dataType: "moveObject",
					fields: {
						...lottery,
						remaining_fee: lottery.remainingFee,
						prize_claimed: lottery.prizeClaimed,
						winning_slot: lottery.winningSlot,
						prize: lottery.prize,
						fee: lottery.fee,
					},
				},
			},
		}
	},

	async queryEvents(_params?: any) {
		return {
			data: events.slice().reverse(),
			hasNextPage: false,
			nextCursor: null,
		}
	},

	async waitForTransaction({ digest }: { digest: string; options?: any }) {
		return txResults.get(digest) ?? { digest }
	},

	async getOwnedObjects() {
		return { data: [], hasNextPage: false, nextCursor: null }
	},

	async getDynamicFields() {
		return { data: [], hasNextPage: false, nextCursor: null }
	},
}

export const executeTransaction = async (transaction: Transaction, sender?: string) => {
	const digest = newDigest()
	const details = transaction.calls.reduce<{
		events: RecordedEvent[]
		objectChanges: NonNullable<RecordedTx["objectChanges"]>
	}>(
		(acc, call) => {
			const result = executeCall(call, sender)
			return {
				events: [...(acc.events ?? []), ...(result.events ?? [])],
				objectChanges: [...(acc.objectChanges ?? []), ...(result.objectChanges ?? [])],
			}
		},
		{ events: [], objectChanges: [] }
	)

	recordTx(digest, details)
	return { digest }
}

export type MockClient = typeof chainClient
