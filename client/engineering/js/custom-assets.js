/**
 * Custom 3D Assets Configuration
 * Map lesson parts to your custom GLB/GLTF/OBJ files here.
 * Path is relative to the project root.
 */

export const CustomAssets = {
  // 1. Robot Arm
  robotArm: {
    base: { url: '3D Asset/Robot Arm/base.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p2: { url: '3D Asset/Robot Arm/Part2.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p3: { url: '3D Asset/Robot Arm/Part3.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p4: { url: '3D Asset/Robot Arm/Part4.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p5: { url: '3D Asset/Robot Arm/Part5.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p6: { url: '3D Asset/Robot Arm/Part6.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p7: { url: '3D Asset/Robot Arm/Part7.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    p8: { url: '3D Asset/Robot Arm/Part8.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fullModel: { url: '3D Asset/robot arm.glb', scale: 1.0, position: { x: 0, y: 0, z: 0 } }
  },

  // 2. Drone
  drone: {
    frame: { url: '3D Asset/Drone/Main frame.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    mirrorFrame: { url: '3D Asset/Drone/Main frame_MIR.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    armGear: { url: '3D Asset/Drone/Arm gear.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    beaterDisc: { url: '3D Asset/Drone/Beater disc.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    gearing: { url: '3D Asset/Drone/Gearing.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    impeller: { url: '3D Asset/Drone/Impellar Blade.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    leg: { url: '3D Asset/Drone/Leg.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    nut: { url: '3D Asset/Drone/Nut.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    screw: { url: '3D Asset/Drone/Screw.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    xyz: { url: '3D Asset/Drone/xyz.glb', scale: 10, position: { x: 0, y: 0, z: 0 } }
  },

  // 3. Robot Gripper
  robotGripper: {
    basePlate: { url: '3D Asset/Robot Gripper/Base Plate.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    baseMount: { url: '3D Asset/Robot Gripper/Base Mounting bracket.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    baseGear: { url: '3D Asset/Robot Gripper/Base Gear.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    link1: { url: '3D Asset/Robot Gripper/Gear link 1.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    link2: { url: '3D Asset/Robot Gripper/Gear link 2.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    gripper: { url: '3D Asset/Robot Gripper/Gripper.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    link: { url: '3D Asset/Robot Gripper/Link.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    pin: { url: '3D Asset/Robot Gripper/Pin.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fullModel: { url: '3D Asset/robot gripper.glb', scale: 1.0, position: { x: 0, y: 0, z: 0 } }
  },

  // 4. Machine Vice
  machineVice: {
    base: { url: '3D Asset/Machine Vice/Part8-grundplatte.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    guideRail: { url: '3D Asset/Machine Vice/Part6-fuhrungschiene.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fixedJaw: { url: '3D Asset/Machine Vice/Part2 Feste Backe.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    movableJaw: { url: '3D Asset/Machine Vice/Part3-lose backe.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    spindleBase: { url: '3D Asset/Machine Vice/Part4 spindelsockel.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    spindle: { url: '3D Asset/Machine Vice/Part7-TrapezSpindel.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    sleeve: { url: '3D Asset/Machine Vice/Part9-Druckhulse.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    part1: { url: '3D Asset/Machine Vice/Part1.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    part1Fuhr: { url: '3D Asset/Machine Vice/Part1 Fuhrung.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    jawPlate: { url: '3D Asset/Machine Vice/Part5-Spannbacke.glb', scale: 10, position: { x: 0, y: 0, z: 0 } }
  },

  // 5. Suspension
  suspension: {
    base: { url: '3D Asset/Suspension/BASE.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    spring: { url: '3D Asset/Suspension/SPRING.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    rod: { url: '3D Asset/Suspension/ROD.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    nut: { url: '3D Asset/Suspension/NUT.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    nit: { url: '3D Asset/Suspension/NIT.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fullModel: { url: '3D Asset/suspension.gltf', scale: 1.0, position: { x: 0, y: 0, z: 0 } }
  },

  // 6. Leaf Spring
  leafSpring: {
    support: { url: '3D Asset/Leaf Spring/Support.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    supportChassis: { url: '3D Asset/Leaf Spring/Support-Chassis.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    supportChassisRigid: { url: '3D Asset/Leaf Spring/Support-Chassis Rigid.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    layer: { url: '3D Asset/Leaf Spring/Leaf-Layer.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    clampCenter: { url: '3D Asset/Leaf Spring/Clamp-Center.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    clampPrimary: { url: '3D Asset/Leaf Spring/Clamp-Primary.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    clampSecondary: { url: '3D Asset/Leaf Spring/Clamp-Secondary.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    rubber: { url: '3D Asset/Leaf Spring/Support-Rubber.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    rubber60: { url: '3D Asset/Leaf Spring/Support-Rubber 60mm.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fullModel: { url: '3D Asset/leaf spring.glb', scale: 1.0, position: { x: 0, y: 0, z: 0 } }
  },

  // 7. V4 Engine
  v4Engine: {
    connectingRodCap: { url: '3D Asset/V4_Engine/Connecting Rod Cap.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    connectingRod: { url: '3D Asset/V4_Engine/Connecting Rod.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    conrodBolt: { url: '3D Asset/V4_Engine/Conrod Bolt.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    crankshaft: { url: '3D Asset/V4_Engine/Crankshaft.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    pistonPin: { url: '3D Asset/V4_Engine/Piston Pin.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    pistonRing: { url: '3D Asset/V4_Engine/Piston Ring.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    piston: { url: '3D Asset/V4_Engine/Piston.glb', scale: 10, position: { x: 0, y: 0, z: 0 } },
    fullModel: { url: '3D Asset/v4_engine_full.glb', scale: 15.0, position: { x: 0, y: 0, z: 0 } }
  }
};
