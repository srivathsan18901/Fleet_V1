import { Component } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';
import { environment } from '../../../../environments/environment.development';
import { ProjectService } from '../../../services/project.service';

@Component({
  selector: 'app-robot',
  templateUrl: './robot.component.html',
  styleUrl: './robot.component.css',
})
export class RobotComponent {
  //Move Parameters
  moveParams: {
    maxLinearVelocity: number;
    maxAngularVelocity: number;
    maxToleranceAtGoalX: number;
    maxToleranceAtGoalY: number;
    maxToleranceAtGoalOrientation: number;
    endPointOrientation: number;
    autoRobotOperationModeMOV: string;
    autoRobotModeDefault: number;
    autoRobotModeNarrow1: number;
  } = {
    maxLinearVelocity: 0,
    maxAngularVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    endPointOrientation: 0,
    autoRobotOperationModeMOV: 'mode1',
    autoRobotModeDefault: 0,
    autoRobotModeNarrow1: 0,
  };

  //Dock Parameters
  dockParams: {
    maxLinearVelocity: number;
    maxToleranceAtGoalX: number;
    maxToleranceAtGoalY: number;
    maxToleranceAtGoalOrientation: number;
    goalOffsetX: number;
    goalOffsetY: number;
    goalOffsetOrientation: number;
    endPointOrientation: number;
    dockingType: number;
  } = {
    maxLinearVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    goalOffsetX: 0,
    goalOffsetY: 0,
    goalOffsetOrientation: 0,
    endPointOrientation: 0,
    dockingType: 0,
  };

  //Undock Parameters
  unDockParams: {
    maxLinearVelocity: number;
    maxToleranceAtGoalX: number;
    maxToleranceAtGoalY: number;
    maxToleranceAtGoalOrientation: number;
    endPointOrientation: number;
    undockingDistance: number;
  } = {
    maxLinearVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    endPointOrientation: 0,
    undockingDistance: 0,
  };

  //Charge Parameters
  chargeParams: {
    maxLinearVelocity: number;
    maxToleranceAtGoalX: number;
    maxToleranceAtGoalY: number;
    maxToleranceAtGoalOrientation: number;
    goalOffsetX: number;
    goalOffsetY: number;
    goalOffsetOrientation: number;
    endPointOrientation: number;
    dockingType: number;
  } = {
    maxLinearVelocity: 0,
    maxToleranceAtGoalX: 0,
    maxToleranceAtGoalY: 0,
    maxToleranceAtGoalOrientation: 0,
    goalOffsetX: 0,
    goalOffsetY: 0,
    goalOffsetOrientation: 0,
    endPointOrientation: 0,
    dockingType: 0,
  };

  //Geometry Parameters
  geometryParams: {
    Width: number;
    Length: number;
    SafetyZonesNormal: {
      Front: number;
      Rear: number;
      Left: number;
      Right: number;
    };
    SafetyZonesWithLoad: {
      Front: number;
      Rear: number;
      Left: number;
      Right: number;
    };
  } = {
    Width: 0,
    Length: 0,
    SafetyZonesNormal: {
      Front: 0.0,
      Rear: 0.0,
      Left: 0.0,
      Right: 0.0,
    },
    SafetyZonesWithLoad: {
      Front: 0.0,
      Rear: 0.0,
      Left: 0.0,
      Right: 0.0,
    },
  };

  //Battery Parameters
  batteryParams: {
    minimumbattery: number;
    maximumbattery: number;
    warningbattery: number;
    warningVoltage: number;
    minimumVoltage: number;
    useOnlyPercentage: number;
    useCurrent: number;
  } = {
    minimumbattery: 0,
    maximumbattery: 0,
    warningbattery: 0,
    warningVoltage: 0,
    minimumVoltage: 0,
    useOnlyPercentage: 0,
    useCurrent: 0,
  };

  constructor(
    private translationService: TranslationService,
    private projectService: ProjectService
  ) {}

  async ngOnInit() {
    await this.fetchRoboParams();
  }

  async fetchRoboParams() {
    let project = this.projectService.getSelectedProject();
    if (!project) return;

    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/get-robot-params/${project._id}`,
      { method: 'GET', credentials: 'include' }
    );

    let data = await response.json();
    console.log(data);
  }

  getTranslation(key: string) {
    return this.translationService.getEnvmapTranslation(key);
  }

  toggleMOVEndPointOrientation() {
    if (this.moveParams.endPointOrientation) {
      this.moveParams.endPointOrientation = 1;
    } else {
      this.moveParams.endPointOrientation = 0;
    }
  }

  updateRobotOperationMode() {
    if (this.moveParams.autoRobotOperationModeMOV === 'mode1') {
      this.moveParams.autoRobotModeDefault = 1;
      this.moveParams.autoRobotModeNarrow1 = 0;
    } else {
      this.moveParams.autoRobotModeDefault = 0;
      this.moveParams.autoRobotModeNarrow1 = 1;
    }
  }

  async savDATA() {
    let project = this.projectService.getSelectedProject();
    if (!project) return;
    await this.saveGrossRoboParams(project);
  }

  toggleDOCEndPointOrientation() {
    if (this.dockParams.endPointOrientation) {
      this.dockParams.endPointOrientation = 1;
    } else {
      this.dockParams.endPointOrientation = 0;
    }
  }

  savDock() {
    console.log('Dock Form Data:', this.dockParams);
  }

  toggleUDEndPointOrientation() {
    if (this.unDockParams.endPointOrientation) {
      this.unDockParams.endPointOrientation = 1;
    } else {
      this.unDockParams.endPointOrientation = 0;
    }
  }

  savUNDOCK() {
    console.log('Undock Form Data:', this.unDockParams);
  }

  toggleCHARGEEndPointOrientation() {
    if (this.chargeParams.endPointOrientation) {
      this.chargeParams.endPointOrientation = 1;
    } else {
      this.chargeParams.endPointOrientation = 0;
    }
  }

  savCHARGE() {
    console.log('Charge Form Data:', this.chargeParams);
  }

  savGEOMETRY() {
    console.log('Geometry Form Data:', this.geometryParams);
  }

  toggleUSE_ONLY_PERCENTAGE() {
    if (this.batteryParams.useOnlyPercentage) {
      this.batteryParams.useOnlyPercentage = 1;
    } else {
      this.batteryParams.useOnlyPercentage = 0;
    }
  }
  toggleUSE_CURRENT() {
    if (this.batteryParams.useCurrent) {
      this.batteryParams.useCurrent = 1;
    } else {
      this.batteryParams.useCurrent = 0;
    }
  }

  savBATTERY() {
    console.log('Battery Form Data:', this.batteryParams);
  }

  async saveGrossRoboParams(project: any) {
    let bodyData = {
      projectId: project._id,
      robotParams: {
        DockParam: this.dockParams,
        UnDockParam: this.unDockParams,
        ChargeParam: this.chargeParams,
        MoveParam: this.moveParams,
        BatteryParam: this.batteryParams,
        GeometryParam: this.geometryParams,
      },
    };
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/config-fleet-params/robot`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      }
    );

    let data = await response.json();

    if (data.error) {
      alert('Error while configuring Robot Params');
      return;
    }

    if (data.isRoboParamsConfigured) {
      alert('Robot parameters configured!');
    } else alert('Robot parameters not configured yet!');
  }
}
