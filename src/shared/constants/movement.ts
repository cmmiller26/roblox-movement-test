import { StarterPlayer, Workspace } from "@rbxts/services";

export const Speeds = {
	WALKING: StarterPlayer.CharacterWalkSpeed,
	RUNNING: StarterPlayer.CharacterWalkSpeed * 2,
	CROUCHED: StarterPlayer.CharacterWalkSpeed / 2,
	WALL_RUNNING: StarterPlayer.CharacterWalkSpeed * 2,
	TRANSITION_BUFFER: 1,
};

export const Physics = {
	DEFAULT_FRICTION: 2,
};

export const Detection = {
	GROUND_SEARCH_DISTANCE: 0.25,
	CEILING_SEARCH_DISTANCE: 1,
	WALL_SEARCH_DISTANCE: 0.5,
	COLLISION_PART_SIZE: new Vector3(2, 3, 1),
	COLLISION_PART_TWEEN_TIME: 0.2,
	CAMERA_OFFSET_TWEEN_TIME: 0.1,
};

export const AirControl = {
	IMPULSE: 1.5,
	MAX_SPEED: Speeds.WALKING,
};

export const Crouching = {
	OFFSET: 1.5,
	FALL_SETTLE_THRESHOLD: 2,
	FALL_MIN_SETTLE_TIME: 0.1,
	FALL_MAX_SETTLE_TIME: 0.5,
};

const JUMP_IMPULSE = math.sqrt(2 * Workspace.Gravity * StarterPlayer.CharacterJumpHeight);
export const Jumping = {
	IMPULSE: JUMP_IMPULSE,
	SLIDE_IMPULSE: JUMP_IMPULSE * 1.5,
	WALL_IMPULSE: JUMP_IMPULSE * 1.5,
	UPWARD_BLEND: 0.5,
	SLIDE_UPWARD_BLEND: 0.5,
	WALL_UPWARD_BLEND: 0.25,
	MIN_TIME: 0.1,
};

export const Sliding = {
	OFFSET: Crouching.OFFSET + 0.5,
	IMPULSE: 25,
	FRICTION: Physics.DEFAULT_FRICTION / 4,
	MIN_TIME: 0.1,
	MAX_SLOPE_ANGLE: 30,
};

export const WallRunning = {
	GROUND_OFFSET: 1,
	DEACCELERATION: 50,
	CAMERA_TILT_ANGLE: 15,
};
