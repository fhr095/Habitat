import * as OBC from "@thatopen/components";

export default function SetupScene(containerRef, setCamera) {
  let components = new OBC.Components();
  let worlds = components.get(OBC.Worlds);
  let world = worlds.create();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, containerRef.current);
  world.camera = new OBC.OrthoPerspectiveCamera(components);

  world.scene.setup();
  world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);

  components.init();

  world.scene.three.background = null;
  setCamera(world.camera);

  return { components, world };
}
