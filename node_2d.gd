extends Node2D


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	print("on start")

# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	pass

func _input(event):
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_W:
			position.y -= 10
		elif event.keycode == KEY_S:
			position.y += 10
		elif event.keycode == KEY_A:
			position.x -= 10
		elif event.keycode == KEY_D:
			position.x += 10
