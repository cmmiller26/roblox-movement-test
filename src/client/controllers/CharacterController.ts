import { Controller, OnPhysics, OnStart } from "@flamework/core";
import { ContextActionService, Players, UserInputService } from "@rbxts/services";
import MovementCharacter from "client/classes/movement/MovementCharacter";
import CameraController from "./CameraController";

@Controller()
class CharacterController implements OnStart, OnPhysics {
	private readonly player = Players.LocalPlayer;
	private movementCharacter: MovementCharacter | undefined;

	constructor(private cameraController: CameraController) {}

	onStart(): void {
		this.player.CharacterAdded.Connect((character) => this.onCharacterAdded(character));
		this.player.CharacterRemoving.Connect(() => this.onCharacterRemoving());

		this.setupControls();
	}

	onPhysics(dt: number): void {
		const lookVector = this.cameraController.camera.CFrame.LookVector;
		this.movementCharacter?.update(dt, new Vector3(lookVector.X, 0, lookVector.Z).Unit);
	}

	private setupControls(): void {
		UserInputService.JumpRequest.Connect(() => this.onJumpRequest());

		ContextActionService.BindAction(
			"Sprint",
			(...args) => this.onSprintAction(...args),
			false,
			Enum.KeyCode.LeftShift,
		);

		ContextActionService.BindAction(
			"Crouch",
			(...args) => this.onCrouchAction(...args),
			false,
			Enum.KeyCode.LeftControl,
			Enum.KeyCode.C,
		);
	}

	private onCharacterAdded(character: Model): void {
		this.movementCharacter = MovementCharacter.fromModel(character);
	}

	private onCharacterRemoving(): void {
		this.movementCharacter?.destroy();
		this.movementCharacter = undefined;
	}

	private onJumpRequest(): void {
		this.movementCharacter?.handleJumpRequest();
	}

	private onSprintAction(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject): void {
		if (inputState === Enum.UserInputState.Begin) {
			this.movementCharacter?.handleSprintRequest(true);
		} else if (inputState === Enum.UserInputState.End) {
			this.movementCharacter?.handleSprintRequest(false);
		}
	}

	private onCrouchAction(actionName: string, inputState: Enum.UserInputState, inputObject: InputObject): void {
		if (inputState === Enum.UserInputState.Begin) {
			this.movementCharacter?.handleCrouchRequest(true);
		} else if (inputState === Enum.UserInputState.End) {
			this.movementCharacter?.handleCrouchRequest(false);
		}
	}
}

export default CharacterController;
