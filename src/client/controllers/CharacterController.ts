import { Controller, OnStart, OnPhysics, OnRender } from "@flamework/core";
import { ContextActionService, Players, UserInputService } from "@rbxts/services";
import MovementCharacter from "client/classes/movement/MovementCharacter";
import { Events } from "client/network";
import CameraController from "./CameraController";

@Controller()
class CharacterController implements OnStart, OnPhysics, OnRender {
	private readonly player = Players.LocalPlayer;

	private movementCharacter: MovementCharacter | undefined;

	constructor(private cameraController: CameraController) {
		print("CharacterController initialized");
	}

	onStart(): void {
		this.player.CharacterAdded.Connect((character) => this.onCharacterAdded(character));

		this.setupControls();
	}

	onPhysics(dt: number): void {
		const lookVector = this.cameraController.camera.CFrame.LookVector;
		this.movementCharacter?.update(dt, new Vector3(lookVector.X, 0, lookVector.Z).Unit);
	}

	onRender(): void {
		if (this.movementCharacter) {
			this.cameraController.camera.CFrame = this.cameraController.camera.CFrame.mul(
				CFrame.Angles(0, 0, math.rad(this.movementCharacter.cameraTiltZ.Value)),
			);
		}
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
		const rootPart = character.WaitForChild("HumanoidRootPart");
		if (!rootPart || !rootPart.IsA("BasePart")) {
			warn("HumanoidRootPart not found on character");
			return;
		}
		const humanoid = character.WaitForChild("Humanoid");
		if (!humanoid || !humanoid.IsA("Humanoid")) {
			warn("Humanoid not found on character");
			return;
		}

		humanoid.HealthChanged.Connect((health) => {
			if (health <= 0) humanoid.ChangeState(Enum.HumanoidStateType.Dead);
		});
		character.DescendantRemoving.Connect((descendant) => {
			if (descendant === rootPart) humanoid.TakeDamage(humanoid.MaxHealth);
		});
		humanoid.Died.Connect(() => {
			this.movementCharacter?.destroy();
			this.movementCharacter = undefined;

			Events.CharacterDied.fire();
		});

		this.movementCharacter = MovementCharacter.create(character, rootPart, humanoid);
		if (!this.movementCharacter) {
			warn("Failed to create MovementCharacter from model");
			return;
		}

		print("MovementCharacter created");
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
