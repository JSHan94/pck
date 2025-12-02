import { FC } from "react"
import { SecretManagement } from "../lottery/components/SecretManagement"

type Props = {
	currentAccountAddress?: string
	onStatus?: (message: string) => void
}

export const MySecretPanel: FC<Props> = ({ currentAccountAddress, onStatus }) => {
	return (
		<div className="nes-container with-title">
			<p className="title">My Secret (One-Time Setup)</p>
			<SecretManagement
				currentAccountAddress={currentAccountAddress}
				onStatusChange={onStatus || (() => { })}
			/>
		</div>
	)
}
