import React, {Suspense} from "react";
import {
  TextureLoader,
  RepeatWrapping,
  Mesh,
  ShaderMaterial,
  Color,
  Vector3,
  AdditiveBlending,
  Group,
  Texture,
} from "three";
import LensFlare from "./lensFlare";
import {fragment, vertex} from "./shaders";
import getUniforms from "./uniforms";
import ColorUtil from "color";
import {useTexture} from "@react-three/drei";
import {useFrame} from "@react-three/fiber";
import {useStarmapStore} from "../starmapStore";

import texturePath from "./textures/01_Texture.jpg";
import spritePath from "./textures/Star.svg";
const distanceVector = new Vector3();

const StarSprite = ({color1}: {color1?: number | Color}) => {
  const spriteMap = useTexture(spritePath) as Texture;

  return (
    <sprite>
      <spriteMaterial
        attach="material"
        map={spriteMap}
        color={color1}
        sizeAttenuation={false}
      ></spriteMaterial>
    </sprite>
  );
};
const SPRITE_SCALE_FACTOR = 50;
const Star: React.FC<{
  color1?: number | Color;
  color2?: number | Color;
  size?: number;
  position?: Vector3 | [number, number, number];
  noLensFlare?: boolean;
  showSprite?: boolean;
}> = ({
  color1 = 0x224488,
  color2 = 0xf6fcff,
  size,
  noLensFlare,
  showSprite,
  ...props
}) => {
  const texture = React.useMemo(() => {
    const loader = new TextureLoader();
    const texture = loader.load(texturePath);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
  }, [texturePath]);
  const uniforms = React.useMemo(
    () => getUniforms({map: texture, color1, color2}),
    [color1, color2, texture]
  );
  const shader = React.useRef<Mesh>();
  const starMesh = React.useRef<Group>();
  const starSprite = React.useRef<Group>();

  const viewingMode = useStarmapStore(state => state.viewingMode);

  useFrame(({camera}) => {
    shader.current?.quaternion.copy(camera.quaternion);
    if (shader.current) {
      const mat = shader.current.material as ShaderMaterial;
      mat.uniforms.time.value += 0.03;
      mat.uniforms.color1.value = color1;
      mat.uniforms.color2.value = color2;
    }

    const distance = camera.position.distanceTo(
      distanceVector.set(camera.position.x, 0, camera.position.z)
    );
    if (starSprite.current && starMesh.current) {
      if (
        size &&
        distance / size > 100 &&
        (useStarmapStore.getState().viewingMode === "core" || showSprite)
      ) {
        starSprite.current.visible = true;
        starMesh.current.visible = false;
      } else {
        starSprite.current.visible = false;
        starMesh.current.visible = true;
      }
    }
  });
  const color = React.useMemo(() => {
    if (typeof color1 === "number") {
      const color = color1.toString(16);
      return `#${color}`;
    }
    const color = color1.toArray();
    const colorVal = `rgb(${Math.round(color[0] * 255)},${Math.round(
      color[1] * 255
    )},${Math.round(color[2] * 255)})`;
    return ColorUtil(colorVal).lighten(90).rgbNumber();
  }, [color1]);

  const spriteScale = 1 / (size || 1) / SPRITE_SCALE_FACTOR;
  return (
    <group {...props}>
      <pointLight intensity={0.8} decay={2} color={color} castShadow />
      <group ref={starSprite} scale={[spriteScale, spriteScale, spriteScale]}>
        <Suspense fallback={null}>
          <StarSprite color1={color1} />
        </Suspense>
      </group>
      <group ref={starMesh}>
        <mesh ref={shader} uuid="My star">
          <circleBufferGeometry attach="geometry" args={[1, 8, 8]} />
          <shaderMaterial
            attach="material"
            fragmentShader={fragment}
            vertexShader={vertex}
            uniforms={uniforms}
            blending={AdditiveBlending}
            transparent
            depthTest={false}
          />
        </mesh>
        <mesh uuid="My star background">
          <sphereBufferGeometry attach="geometry" args={[0.5, 32, 32]} />
          <meshBasicMaterial attach="material" color={0x000000} />
        </mesh>
      </group>
      {viewingMode !== "core" && !noLensFlare && <LensFlare />}
    </group>
  );
};

export default Star;
