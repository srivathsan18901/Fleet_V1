import { Component } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-robot',
  templateUrl: './robot.component.html',
  styleUrl: './robot.component.css'
})
export class RobotComponent {
  constructor(
    private translationService: TranslationService,
  ){ }
  getTranslation(key: string) {
    return this.translationService.getEnvmapTranslation(key);
  }
  //Move Parameters
  maxLinearVelocityMOV: number = 0;
  maxAngularVelocityMOV: number = 0;
  maxToleranceAtGoalXMOV: number = 0;
  maxToleranceAtGoalYMOV: number = 0;
  maxToleranceAtGoalOrientationMOV: number = 0;
  endPointOrientationMOV: number = 0;
  autoRobotOperationModeMOV: string = 'mode1'; // Default value
  DefaultautoRobotOperationModeMOV: number = 0; // Default mode selected (1)
  NarrowautoRobotOperationModeMOV: number = 0; // Narrow mode deselected (0)

  toggleMOVEndPointOrientation() {
    if(this.endPointOrientationMOV){
      this.endPointOrientationMOV=1;
    }
    else{
      this.endPointOrientationMOV=0;
    }
    console.log("hey",this.endPointOrientationMOV);    
  }
  updateRobotOperationMode() {
    if (this.autoRobotOperationModeMOV === 'mode1') {
      this.DefaultautoRobotOperationModeMOV = 1;
      this.NarrowautoRobotOperationModeMOV = 0;
    } else {
      this.DefaultautoRobotOperationModeMOV = 0;
      this.NarrowautoRobotOperationModeMOV = 1;
    }
  }
  savMov() {
    console.log("Move Form Data:", {
      maxLinearVelocityMOV: this.maxLinearVelocityMOV,
      maxAngularVelocityMOV: this.maxAngularVelocityMOV,
      maxToleranceAtGoalXMOV: this.maxToleranceAtGoalXMOV,
      maxToleranceAtGoalYMOV: this.maxToleranceAtGoalYMOV,
      maxToleranceAtGoalOrientationMOV: this.maxToleranceAtGoalOrientationMOV,
      endPointOrientationMOV: this.endPointOrientationMOV,
      DefaultautoRobotOperationModeMOV: this.DefaultautoRobotOperationModeMOV, // 1 if Default selected, 0 otherwise
      NarrowautoRobotOperationModeMOV: this.NarrowautoRobotOperationModeMOV, 
    });
  }
  //Dock Parameters
  max_linear_velocityDOCK: number = 0;
  max_tolerance_at_goal_xDOCK: number = 0;
  max_tolerance_at_goal_yDOCK: number = 0;
  max_tolerance_at_goal_orientationDOCK: number = 0;
  goal_offset_xDOCK: number = 0;
  goal_offset_yDOCK: number = 0;
  goal_offset_orientationDOCK: number = 0;
  end_point_orientationDOCK: number = 0;
  docking_typeDOCK: number = 0;

  toggleDOCEndPointOrientation() {
    if(this.end_point_orientationDOCK){
      this.end_point_orientationDOCK=1;
    }
    else{
      this.end_point_orientationDOCK=0;
    }
  }
  savDock(){
    console.log("Dock Form Data:", {
      max_linear_velocityDOCK: this.max_linear_velocityDOCK,
      max_tolerance_at_goal_xDOCK: this.max_tolerance_at_goal_xDOCK,
      max_tolerance_at_goal_yDOCK: this.max_tolerance_at_goal_yDOCK,
      max_tolerance_at_goal_orientationDOCK: this.max_tolerance_at_goal_orientationDOCK,
      goal_offset_xDOCK: this.goal_offset_xDOCK,
      goal_offset_yDOCK: this.goal_offset_yDOCK,
      goal_offset_orientationDOCK: this.goal_offset_orientationDOCK,
      end_point_orientationDOCK: this.end_point_orientationDOCK, // 1 if Default selected, 0 otherwise
      docking_typeDOCK: this.docking_typeDOCK, 
    });
  }
  //Undock Parameters
  max_linear_velocityUD: number = 0;
  max_angular_velocityUD: number = 0;
  max_tolerance_at_goal_xUD: number = 0;
  max_tolerance_at_goal_yUD: number = 0;
  max_tolerance_at_goal_orientationUD: number = 0;
  end_point_orientationUD: number = 0;
  toggleUDEndPointOrientation() {
    if(this.end_point_orientationUD){
      this.end_point_orientationUD=1;
    }
    else{
      this.end_point_orientationUD=0;
    }
  }
  savUNDOCK(){
    console.log("Undock Form Data:", {
      max_linear_velocityUD: this.max_linear_velocityUD,
      max_angular_velocityUD: this.max_angular_velocityUD,
      max_tolerance_at_goal_xUD: this.max_tolerance_at_goal_xUD,
      max_tolerance_at_goal_yUD: this.max_tolerance_at_goal_yUD,
      max_tolerance_at_goal_orientationUD: this.max_tolerance_at_goal_orientationUD,
      end_point_orientationUD: this.end_point_orientationUD,
    });
  }
  //Charge Parameters
  max_linear_velocityCHARGE: number = 0;
  max_tolerance_at_goal_xCHARGE: number = 0;
  max_tolerance_at_goal_yCHARGE: number = 0;
  max_tolerance_at_goal_orientationCHARGE: number = 0;
  goal_offset_xCHARGE: number = 0;
  goal_offset_yCHARGE: number = 0;
  goal_offset_orientationCHARGE: number = 0;
  end_point_orientationCHARGE: number = 0;
  docking_typeCHARGE: number = 0;

  toggleCHARGEEndPointOrientation() {
    if(this.end_point_orientationCHARGE){
      this.end_point_orientationCHARGE=1;
    }
    else{
      this.end_point_orientationCHARGE=0;
    }
  }
  
  savCHARGE(){
    console.log("Charge Form Data:", {
      max_linear_velocityCHARGE: this.max_linear_velocityCHARGE,
      max_tolerance_at_goal_xCHARGE: this.max_tolerance_at_goal_xCHARGE,
      max_tolerance_at_goal_yCHARGE: this.max_tolerance_at_goal_yCHARGE,
      max_tolerance_at_goal_orientationCHARGE: this.max_tolerance_at_goal_orientationCHARGE,
      goal_offset_xCHARGE: this.goal_offset_xCHARGE,
      goal_offset_yCHARGE: this.goal_offset_yCHARGE,
      goal_offset_orientationCHARGE: this.goal_offset_orientationCHARGE,
      end_point_orientationCHARGE: this.end_point_orientationCHARGE,
      docking_typeCHARGE: this.docking_typeCHARGE,
    });
  }
  //Geometry Parameters
  WIDTHGeo: number = 0;
  LENGTHGeo: number = 0;
  SAFETY_ZONES_NORMAL_F: number = 0;
  SAFETY_ZONES_NORMAL_R: number = 0;
  SAFETY_ZONES_NORMAL_L: number = 0;
  SAFETY_ZONES_NORMAL_RI: number = 0;
  SAFETY_ZONES_WITH_LOAD_F: number = 0;
  SAFETY_ZONES_WITH_LOAD_R: number = 0;
  SAFETY_ZONES_WITH_LOAD_L: number = 0;
  SAFETY_ZONES_WITH_LOAD_RI: number = 0;


  savGEOMETRY(){
    console.log("Geometry Form Data:", {
      WIDTHGeo: this.WIDTHGeo,
      LENGTHGeo: this.LENGTHGeo,
      SAFETY_ZONES_NORMAL_F: this.SAFETY_ZONES_NORMAL_F,
      SAFETY_ZONES_NORMAL_R: this.SAFETY_ZONES_NORMAL_R,
      SAFETY_ZONES_NORMAL_L: this.SAFETY_ZONES_NORMAL_L,
      SAFETY_ZONES_NORMAL_RI: this.SAFETY_ZONES_NORMAL_RI,
      SAFETY_ZONES_WITH_LOAD_F: this.SAFETY_ZONES_WITH_LOAD_F,
      SAFETY_ZONES_WITH_LOAD_R: this.SAFETY_ZONES_WITH_LOAD_R,
      SAFETY_ZONES_WITH_LOAD_L: this.SAFETY_ZONES_WITH_LOAD_L,
      SAFETY_ZONES_WITH_LOAD_RI: this.SAFETY_ZONES_WITH_LOAD_RI,
    });
  }
  //Battery Parameters
  MINIMUM_BATTERY: number = 0;
  MAXIMUM_BATTERY: number = 0;
  WARNING_BATTERY: number = 0;
  WARNING_VOLTAGE: number = 0;
  MINIMUM_VOLTAGE: number = 0;
  USE_ONLY_PERCENTAGE: number = 0;
  USE_CURRENT: number = 0;

  toggleUSE_ONLY_PERCENTAGE() {
    if(this.USE_ONLY_PERCENTAGE){
      this.USE_ONLY_PERCENTAGE=1;
    }
    else{
      this.USE_ONLY_PERCENTAGE=0;
    }
  }
  toggleUSE_CURRENT() {
    if(this.USE_CURRENT){
      this.USE_CURRENT=1;
    }
    else{
      this.USE_CURRENT=0;
    }
  }

  savBATTERY(){
    console.log("Battery Form Data:", {
      MINIMUM_BATTERY: this.MINIMUM_BATTERY,
      MAXIMUM_BATTERY: this.MAXIMUM_BATTERY,
      WARNING_BATTERY: this.WARNING_BATTERY,
      WARNING_VOLTAGE: this.WARNING_VOLTAGE,
      MINIMUM_VOLTAGE: this.MINIMUM_VOLTAGE,
      USE_ONLY_PERCENTAGE: this.USE_ONLY_PERCENTAGE,
      USE_CURRENT: this.USE_CURRENT,
    });
  }
}
