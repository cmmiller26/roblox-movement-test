import { MovementStateContext, MovementStateType } from "shared/types/Movement";
import {
	CrouchedState,
	CrouchFallState,
	MovementState,
	FreefallState,
	JumpingState,
	LandedState,
	RunningState,
	SlidingState,
	WalkingState,
	WallRunning,
} from "./states";

class MovementStateMachine {
	private static readonly MAX_STATE_CHANGE_DEPTH = 5;
	private static readonly STATE_CHANGE_WARNING_DEPTH = 2;

	private readonly states: Record<MovementStateType, MovementState>;

	private currentState: MovementState;

	constructor(context: MovementStateContext) {
		this.states = {
			[MovementStateType.Crouched]: new CrouchedState(context),
			[MovementStateType.CrouchFall]: new CrouchFallState(context),
			[MovementStateType.Freefall]: new FreefallState(context),
			[MovementStateType.Jumping]: new JumpingState(context),
			[MovementStateType.Landed]: new LandedState(context),
			[MovementStateType.Running]: new RunningState(context),
			[MovementStateType.Sliding]: new SlidingState(context),
			[MovementStateType.Walking]: new WalkingState(context),
			[MovementStateType.WallRunning]: new WallRunning(context),
		};

		this.currentState = this.states[MovementStateType.Freefall];
		this.currentState.enter(MovementStateType.Freefall);
	}

	update(dt: number): void {
		const newStateType = this.currentState.update(dt);
		if (newStateType !== undefined) this.changeState(newStateType);
	}

	changeState(stateType: MovementStateType, depth = 0): void {
		if (this.currentState.stateType === stateType) return;

		if (depth === 0 && !this.currentState.exit(stateType)) return;

		if (depth > MovementStateMachine.STATE_CHANGE_WARNING_DEPTH) {
			warn(`State change depth exceeded ${MovementStateMachine.STATE_CHANGE_WARNING_DEPTH}`);
		}
		if (depth > MovementStateMachine.MAX_STATE_CHANGE_DEPTH) {
			warn("Max state change depth exceeded");
			return;
		}

		const state = this.states[stateType];
		const newStateType = state.enter(this.currentState.stateType);
		if (newStateType !== undefined) {
			this.changeState(newStateType, depth + 1);
			return;
		}

		this.currentState = state;

		print(`MovementStateType changed to ${stateType}`);
	}

	getMovementStateType(): MovementStateType {
		return this.currentState.stateType;
	}

	destroy(): void {
		this.currentState.exit();
	}
}

export default MovementStateMachine;
