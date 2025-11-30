import { Controller, OnStart } from "@flamework/core";
import Gizmos from "@rbxts/gizmos";
import { Players, Workspace } from "@rbxts/services";

@Controller()
class CameraController implements OnStart {
	readonly camera = Workspace.CurrentCamera!;

	private readonly player = Players.LocalPlayer;

	onStart() {
		this.player.CameraMode = Enum.CameraMode.LockFirstPerson;
		//Gizmos.enabled = false;
	}
}

export default CameraController;
