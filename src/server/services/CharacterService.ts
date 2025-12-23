import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Events } from "server/network";

@Service()
class CharacterService implements OnStart {
	onStart(): void {
		Players.PlayerAdded.Connect((player) =>
			player.CharacterAdded.Connect((character) => this.onCharacterAdded(character)),
		);

		Events.CharacterDied.connect((player) => this.onCharacterDied(player));
	}

	private setupControllerManager(character: Model, rootPart: BasePart, humanoid: Humanoid): void {
		const controllerManager = new Instance("ControllerManager");

		this.createAirController(controllerManager);
		this.createGroundController(controllerManager, humanoid.HipHeight);

		controllerManager.GroundSensor = this.createGroundSensor(rootPart);
		this.createWallSensor(rootPart);

		controllerManager.RootPart = rootPart;
		controllerManager.Parent = character;
	}

	private createAirController(parent: ControllerManager): AirController {
		const airController = new Instance("AirController");
		airController.BalanceRigidityEnabled = true;
		airController.MaintainLinearMomentum = true;
		airController.MaintainAngularMomentum = false;
		airController.Parent = parent;
		return airController;
	}

	private createGroundController(parent: ControllerManager, groundOffset: number): GroundController {
		const groundController = new Instance("GroundController");
		groundController.BalanceRigidityEnabled = true;
		groundController.GroundOffset = groundOffset;
		groundController.Parent = parent;
		return groundController;
	}

	private createGroundSensor(parent: BasePart): ControllerPartSensor {
		const groundSensor = new Instance("ControllerPartSensor");
		groundSensor.Name = "GroundSensor";
		groundSensor.SensorMode = Enum.SensorMode.Floor;
		groundSensor.UpdateType = Enum.SensorUpdateType.Manual;
		groundSensor.Parent = parent;
		return groundSensor;
	}

	private createWallSensor(parent: BasePart): ControllerPartSensor {
		const wallSensor = new Instance("ControllerPartSensor");
		wallSensor.Name = "WallSensor";
		wallSensor.SensorMode = Enum.SensorMode.Ladder;
		wallSensor.UpdateType = Enum.SensorUpdateType.Manual;
		wallSensor.Parent = parent;
		return wallSensor;
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
		humanoid.EvaluateStateMachine = false;

		this.setupControllerManager(character, rootPart, humanoid);
	}

	private onCharacterDied(player: Player): void {
		task.delay(Players.RespawnTime, () => {
			player.LoadCharacter();
		});
	}
}

export default CharacterService;
