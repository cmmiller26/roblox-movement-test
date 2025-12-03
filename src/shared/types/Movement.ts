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

	applyAirControlImpulse(direction: Vector3): void;

	performGroundCheck(): RaycastResult | undefined;
	performCeilingCheck(distance?: number): RaycastResult | undefined;
	performWallCheck(direction: WallDirection): RaycastResult | undefined;

	configCollisionPartForState(stateType?: MovementStateType, isCrouchFallLand?: boolean): void;
	tiltCameraForWallRun(direction?: WallDirection): void;

	isAtSpeed(speed: number): boolean;
	isBelowSpeed(speed: number): boolean;

	hasCompletedJump(): boolean;
	isOnSteepSlope(): boolean;

	getWallSide(normal: Vector3): WallDirection;

	getHorizontalVelocity(): Vector3;

	getMovementStateType(): MovementStateType;

	getToSprint(): boolean;
	getToCrouch(): boolean;
}

export interface CollisionPart extends BasePart {
	Weld: Weld;
}

export enum WallDirection {
	Left = "Left",
	Right = "Right",
}
