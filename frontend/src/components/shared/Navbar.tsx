import React, { useState } from "react"
import { useNavigation } from "../../providers/navigation/NavigationContext"
import { ConnectButton } from "../../lib/wallet"


const NavBar: React.FC = () => {
	const { currentPage, navigate } = useNavigation()
	const [showHowTo, setShowHowTo] = useState(false)

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black">
			<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-row justify-between items-center h-16">
					{/* Logo & Navigation */}
					<div className="flex items-center space-x-8">
						<div className="flex items-center gap-2 hidden sm:flex">
							<i className="nes-icon is-medium star"></i>
							<h1 className="text-2xl">
								MemePlay
							</h1>
						</div>
						<ul className="flex space-x-2">
							<li>
								<button
									onClick={() => navigate("/")}
									className={`nes-btn ${currentPage === "/" || currentPage.startsWith("/lottery/") ? "is-primary" : ""}`}
								>
									Home
								</button>
							</li>
							<li>
								<button
									onClick={() => navigate("/wallet")}
									className={`nes-btn ${currentPage === "/wallet" ? "is-primary" : ""}`}
								>
									Wallet
								</button>
							</li>
						</ul>
					</div>

					{/* Actions */}
					<div className="flex items-center space-x-3">
						<button
							onClick={() => setShowHowTo(true)}
							className="nes-btn is-warning"
							title="How To Play"
						>
							<span className="text-xl">?</span>
						</button>
						<div className="all-[initial]">
							<ConnectButton />
						</div>
					</div>
				</div>
			</div>

			{/* How To Play Modal */}
			{showHowTo && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
					role="dialog"
					aria-modal="true"
					aria-label="How to play"
					onClick={() => setShowHowTo(false)}
				>
					<div
						className="nes-dialog is-rounded bg-white p-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="title">How to Play</h3>
							<button
								onClick={() => setShowHowTo(false)}
								className="nes-btn is-error"
							>
								X
							</button>
						</div>

						<div className="nes-container is-rounded">
							<ul className="nes-list is-disc">
								<li>Connect Wallet</li>
								<li>Generate Secret</li>
								<li>Choose Lottery</li>
								<li>Pick a Slot</li>
								<li>Win & Claim</li>
							</ul>
						</div>

						<div className="flex justify-end pt-4">
							<button
								onClick={() => setShowHowTo(false)}
								className="nes-btn is-primary"
							>
								Got it!
							</button>
						</div>
					</div>
				</div>
			)}
		</nav>
	)
}

export default NavBar
