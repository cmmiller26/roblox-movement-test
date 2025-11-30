import { Flamework } from "@flamework/core";

export enum MovementStateType {
	Crouched = "Crouched",
	CrouchFall = "CrouchFall",
	Freefall = "Freefall",
	Jumping = "Jumping",
	Landed = "Landed",
	Running = "Running",
	Sliding = "Sliding",
	Walking = "Walking",
	WallRunning = "WallRunning",
}

export interface MovementStateContext {
	readonly character: Model;
	readonly rootPart: BasePart;
	readonly collisionPart: CollisionPart;
	readonly humanoid: Humanoid;

	readonly controllerManager: ControllerManager;
	readonly airController: AirController;
	readonly groundController: GroundController;

	readonly groundSensor: ControllerPartSensor;
	readonly wallSensor: ControllerPartSensor;

	readonly mass: number;

	lastJumpTick: number;

	performGroundCheck(): RaycastResult | undefined;
	performCeilingCheck(offset: number): RaycastResult | undefined;
	performWallCheck(direction: "L" | "R"): RaycastResult | undefined;

	configCollisionPartForState(stateType?: MovementStateType, isCrouchFallLand?: boolean): void;

	getMovementStateType(): MovementStateType;

	getToSprint(): boolean;
	getToCrouch(): boolean;
}

export interface CollisionPart extends BasePart {
	Weld: Weld;
}
