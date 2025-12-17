import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";

@Component({ tag: "Trampoline" })
class TrampolineComponent extends BaseComponent<{}, BasePart> implements OnStart {
	onStart() {
		this.instance.Touched.Connect((otherPart) => this.onTouched(otherPart));
	}

	private onTouched(otherPart: BasePart): void {
		let primaryPart = otherPart;

		const model = otherPart.FindFirstAncestorOfClass("Model");
		if (model) {
			if (model.PrimaryPart) primaryPart = model.PrimaryPart;

			const humanoid = model.FindFirstChildOfClass("Humanoid");
			if (humanoid) {
				if (Players.GetPlayerFromCharacter(model)) return;

				humanoid.Jump = true;
			}
		}

		const velocity = primaryPart.AssemblyLinearVelocity;
		primaryPart.AssemblyLinearVelocity = new Vector3(velocity.X, -velocity.Y, velocity.Z);
	}
}

export default TrampolineComponent;
