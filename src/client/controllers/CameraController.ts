import { Controller, OnStart, OnTick } from "@flamework/core";
import Gizmos from "@rbxts/gizmos";
import { Players, StarterGui, UserInputService, Workspace } from "@rbxts/services";

@Controller()
class CameraController implements OnStart, OnTick {
	readonly camera = Workspace.CurrentCamera!;

	private readonly player = Players.LocalPlayer;
	private isDevConsoleRegistered = false;

	onStart() {
		this.player.CameraMode = Enum.CameraMode.LockFirstPerson;
		//Gizmos.enabled = false;
	}

	onTick(): void {
		if (!this.isDevConsoleRegistered) {
			const [success] = pcall(() => StarterGui.GetCore("DevConsoleVisible"));
			this.isDevConsoleRegistered = success;
		}
		UserInputService.MouseBehavior =
			this.isDevConsoleRegistered && StarterGui.GetCore("DevConsoleVisible")
				? Enum.MouseBehavior.Default
				: Enum.MouseBehavior.LockCenter;
	}
}

export default CameraController;
