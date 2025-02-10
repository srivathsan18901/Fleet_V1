import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  ViewEncapsulation,
  Input,
  viewChild,
} from '@angular/core';
import { SpeedDial } from 'primeng/speeddial';
import { TooltipModule } from 'primeng/tooltip';
import { ExportService } from '../export.service';
import { formatDate } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { RobotParametersPopupComponent } from '../robot-parameters-popup/robot-parameters-popup.component';
import { environment } from '../../environments/environment.development';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { EnvmapComponent } from '../envmap/envmap.component';
import { MessageService, MenuItem } from 'primeng/api';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../auth.service';
import { SessionService } from '../services/session.service';
import { ProjectService } from '../services/project.service';
import { UserPermissionService } from '../services/user-permission.service';
import { TranslationService } from '../services/translation.service';
import { map, Subscription } from 'rxjs';
import { MatPaginatorIntl } from '@angular/material/paginator';

interface Poll {
  ip: string;
  mac: string;
  host: string;
  ping: string;
  Status: string;
}
@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom, // Use shadow DOM to isolate styles
})
export class ConfigurationComponent implements AfterViewInit {
  @ViewChild(EnvmapComponent) envmapComponent!: EnvmapComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadedCanvas', { static: false })
  uploadedCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayLayer', { static: false }) overlayLayer!: ElementRef;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  nodes: Array<{ x: number; y: number; id: number }> = [];
  selectedNode: { x: number; y: number; id: number } | null = null;
  nodeIdCounter: number = 0; // Counter to generate unique IDs for each node
  fleetTab: string = 'general';
  filteredData: any;
  originalData: any;
  searchQuery: string = '';
  isPopupVisible: boolean = false;
  isTransitioning: boolean = false;
  activeButton: string = 'Environment'; // Default active button
  activeHeader: string = this.getTranslation('Environment'); // Default header
  chosenImageName = ''; // Initialize chosenImageName with an empty string
  imageUploaded: boolean = false; // To track if an image is uploaded
  imageFile: File | null = null; // Store the uploaded image file
  isImageOpened: boolean = false; // Track if the image is opened in the canvas
  currentTable = 'Environment';
  currentTab: any;
  imageHeight: number = 0; // Height in meters
  imageWidth: number = 0; // Width in meters
  pixelsPerMeter: number = 0; // Pixels per meter
  private backgroundImage: HTMLImageElement | null = null;
  isConnectivityModeActive: boolean = false; // Track if connectivity mode is active
  connectivityPoints: { x: number; y: number }[] = []; // Store selected points for connectivity
  selectedMap: any = null;
  mapData: any = null;
  isSimulating: boolean = false;
  isPagination: boolean = false;
  searchTerm: string = '';
  filteredEnvData: any[] = [];
  filteredipData: any[] = [];
  filteredRobotData: any[] = [];
  tableLoader: any;
  cookieValue: any;
  userManagementData: any;
  username: string | null = null;
  userrole: string | null = null;

  // formData: any;
  isPopupOpen: boolean = false;
  isScanning = false;
  EnvData: any[] = []; // map details..
  currentRoboDet: any | null = null;
  isRoboInEdit: boolean = false;
  currEditRobo: any | null = null;

  currEditMap: boolean = false;
  onMapEdit: boolean = false;
  currEditMapDet: any | null = null;
  agvKinematicsOptions: any[] = [
    { name: 'DIFF', value: 'DIFF' },
    { name: 'OMNI', value: 'OMNI' },
    { name: 'THREEWHEEL', value: 'THREEWHEEL' },
  ];
  agvClassOptions: any[] = [
    { name: 'NOT_SET', value: 'NOT_SET' },
    { name: 'FORKLIFT', value: 'FORKLIFT' },
    { name: 'CONVEYOR', value: 'CONVEYOR' },
    { name: 'TUGGER', value: 'TUGGER' },
    { name: 'CARRIER', value: 'CARRIER' },
  ];
  localizationTypes: any[] = [
    { name: 'NATURAL', value: 'NATURAL' },
    { name: 'REFLECTOR', value: 'REFLECTOR' },
    { name: 'RFID', value: 'RFID' },
    { name: 'DMC', value: 'DMC' },
    { name: 'SPOT', value: 'SPOT' },
    { name: 'GRID', value: 'GRID' },
  ];
  navigationTypes: any[] = [
    { name: 'PHYSICAL_LINE_GUIDED', value: 'PHYSICAL_LINE_GUIDED' },
    { name: 'VIRTUAL_LINE_GUIDED', value: 'VIRTUAL_LINE_GUIDED' },
    { name: 'AUTONOMOUS', value: 'AUTONOMOUS' },
  ];

  selectedFileName: string = this.getTranslation('import_map_file');
  form: FormData | null = null;
  selectedFile: File | null = null;
  renamedProj: any;
  isRenamed: boolean = false;
  defaultSite: string = '';

  robotData: any[] = [];
  paginatedData: any[] = [];
  paginatedData1: any[] = [];
  paginatedData2: any[] = [];
  simRobos: any;
  private langSubscription!: Subscription;
  // loader
  editLoader: boolean = false;
  configurationPermissions: any;
  environmentPermissions: { read: any; view: any; edit: any } | undefined;

  constructor(
    private cdRef: ChangeDetectorRef,
    private projectService: ProjectService,
    public dialog: MatDialog, // Inject MatDialog
    private messageService: MessageService,
    private sessionService: SessionService,
    private authService: AuthService,
    private cookieService: CookieService,
    private userPermissionService: UserPermissionService,
    private translationService: TranslationService,
    private paginatorIntl: MatPaginatorIntl
  ) {
    this.filteredEnvData = [...this.EnvData];
    // this.filteredRobotData = [...this.robotData];
    // this.filteredRobotData = this.robotData;
  }
  items: any[] = [];
  deleteButtonText: string = '';
  editButtonText: string = '';
  exportButtonText: string = '';
  async ngOnInit() {
    this.paginatorIntl.itemsPerPageLabel =
      this.getTranslation('Items per page'); // Modify the text
    this.paginatorIntl.changes.next(); // Notify paginator about the change
    this.langSubscription = this.translationService.currentLanguage$.subscribe(
      (val) => {
        // this.updateHeaderTranslation();
        this.paginatorIntl.itemsPerPageLabel =
          this.getTranslation('Items per page');
        this.paginatorIntl.changes.next();
        this.activeHeader = this.getTranslation(this.activeButton);
        this.deleteButtonText = this.getTranslation('Delete');
        this.editButtonText = this.getTranslation('edit');
        this.exportButtonText = this.getTranslation('export');
        this.items = [
          {
            label: this.getTranslation('Create'),
            icon: 'pi pi-plus',
            command: () => this.openImageUploadPopup(),
            tooltipOptions: {
              tooltipLabel: this.getTranslation('Create'),
              tooltipPosition: 'top',
            },
          },
          {
            label: this.getTranslation('Import Map'),
            icon: 'pi pi-download',
            command: () => this.openMapImportPopup(),
            tooltipOptions: {
              tooltipLabel: this.getTranslation('Import Map'),
              tooltipPosition: 'top',
            },
          },
        ];
        this.cdRef.detectChanges();
      }
    );

    // const rawData = this.projectService.userManagementServiceGet();
    this.items = [
      {
        label: this.getTranslation('Create'),
        icon: 'pi pi-plus',
        command: () => this.openImageUploadPopup(),
        tooltipOptions: {
          tooltipLabel: this.getTranslation('Create'),
          tooltipPosition: 'top',
        },
      },
      {
        label: this.getTranslation('Import Map'),
        icon: 'pi pi-download',
        command: () => this.openMapImportPopup(),
        tooltipOptions: {
          tooltipLabel: this.getTranslation('Import Map'),
          tooltipPosition: 'top',
        },
      },
    ];
    this.deleteButtonText = this.getTranslation('Delete');
    this.editButtonText = this.getTranslation('edit');
    this.exportButtonText = this.getTranslation('export');

    this.userManagementData = this.userPermissionService.getPermissions();

    if (this.userManagementData?.configurationPermissions) {
      this.configurationPermissions =
        this.userManagementData.configurationPermissions;
      let tabs = ['environment', 'robot', 'fleet'];
      let UITabs = ['Environment', 'Robot', 'Fleet'];
      let activeButtons = ['Environment', 'robot', 'fleet'];
      let i = 0;
      for (let tab of tabs) {
        // console.log(this.configurationPermissions[tab].enabled);
        if (this.configurationPermissions[tab].enabled) {
          this.activeHeader = UITabs[i];
          this.setActiveButton(activeButtons[i]);
          break;
        }
        i++;
      }
    }
    // console.log(this.userManagementData.configurationPermissions)

    // Extract specific states for "Environment"
    this.environmentPermissions = {
      read: this.configurationPermissions.environment.read ?? false,
      view: this.configurationPermissions.environment.view ?? false,
      edit: this.configurationPermissions.environment.edit ?? false,
    };

    // this.initializeDefaultButton()

    const user = this.authService.getUser();
    if (user) {
      this.username = user.name;
      this.userrole = user.role;
    }
    this.cookieValue = JSON.parse(this.cookieService.get('_user'));
    this.selectedMap = this.projectService.getMapData();
    try {
      this.loadData();
      this.setPaginatedData();
      this.setPaginatedData1();
      // this.selectFirstMapIfNoneSelected();
      this.filteredEnvData = [...this.EnvData];
      this.filteredRobotData = [...this.robotData];
      this.cdRef.detectChanges();
      const today = new Date();
      const pastFiveYears = new Date();
      pastFiveYears.setFullYear(today.getFullYear() - 5);

      this.minDate = this.formatDate(pastFiveYears);
      this.maxDate = this.formatDate(today);

      if (this.projectService.getInitializeMapSelected() == 'true') {
        let currMapData = this.projectService.getMapData();
        if (currMapData) {
          // console.log('line 154');
          this.selectedMap = currMapData;
          this.setPaginatedData();
        }
      }

      this.mapData = this.projectService.getSelectedProject(); // _id
      if (!this.mapData) return;
      this.tableLoader = true;
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/fleet-project/${this.mapData._id}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error(`Error code of ${response.status}`);
      let data = await response.json();
      this.tableLoader = false;
      const { sites } = data.project;
      this.defaultSite = sites[0].siteName;

      this.EnvData = sites
        .flatMap((sites: any) => {
          return sites.maps.map((map: any) => {
            let date = new Date(map?.createdAt);
            let createdAt = date.toLocaleString('en-IN', {
              month: 'short',
              year: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            });

            return {
              id: map.mapId,
              mapName: map.mapName,
              siteName: sites.siteName,
              date: createdAt,
              createdAt: map.createdAt, // for sorting..
            };
          });
        })
        .filter((item: any) => item !== null); // just to filter out the null from the EnvData array!..

      this.EnvData.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.filteredEnvData = [...this.EnvData];
      this.setPaginatedData();
      this.cdRef.detectChanges();
      if (this.sessionService.isMapInEdit()) {
        this.onMapEdit = true;
        this.showImageUploadPopup = true;
      }
      // })
    } catch (error) {
      console.log(error);
    }

    this.fetchRobos(); // fetch all robots..

    if (!this.EnvData.length) return;

    this.searchTerm = '';
    this.searchTermChanged();
  }

  getTranslation(key: string) {
    return this.translationService.getConfigurationTranslation(key);
  }
  editedRowIndex: number | null = null;
  editedMapName: string = '';

  editedSiteRowIndex: number | null = null;
  editedSiteName: string = '';

  startEditingMap(index: number, mapName: string) {
    // Close any open site name editor
    this.cancelEditingSite();

    this.editedRowIndex = index;
    this.editedMapName = mapName;
  }

  cancelEditingMap() {
    this.editedRowIndex = null;
    this.editedMapName = '';
  }

  async saveMapName(item: any) {
    // item.mapName = this.editedMapName;
    if (this.editedMapName) await this.updateEditMap(item, true, false);
    this.cancelEditingMap();
  }

  async updateEditMap(map: any, mapNameEdit: boolean, siteNameEdit: boolean) {
    if (
      this.editedMapName.toLocaleLowerCase() ==
        map.mapName.toLocaleLowerCase() ||
      this.editedSiteName.toLocaleLowerCase() ==
        map.siteName.toLocaleLowerCase()
    )
      return;

    let bodyData = {
      newMapName: mapNameEdit ? this.editedMapName : null,
      newSiteName: siteNameEdit ? this.editedSiteName : null,
      mapNameWithSite: map.mapName,
      projectName: this.mapData.projectName,
    };
    // console.log(bodyData);

    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/edit-MapSite-name/${map.mapName}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        }
      );
      let data = await response.json();

      console.log(data);
      if (data.nameUpdated) {
        await this.ngOnInit();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Map/Site Name updated successfully!',
        });
      }
      if (data.error)
        console.log('error while updating map/site name : ', data.error);
    } catch (error) {
      console.error('Error editing map name:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to edit the map name. Please try again later.',
      });
    }
  }

  startEditingSite(index: number, siteName: string) {
    // Close any open map name editor
    this.cancelEditingMap();

    this.editedSiteRowIndex = index;
    this.editedSiteName = siteName;
  }

  cancelEditingSite() {
    this.editedSiteRowIndex = null;
    this.editedSiteName = '';
  }

  async saveSiteName(item: any) {
    // item.siteName = this.editedSiteName;
    if (this.editedSiteName) await this.updateEditMap(item, false, true);
    this.cancelEditingSite();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (
      file.type !== 'application/zip' &&
      file.type !== 'application/x-zip-compressed'
    ) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Selection Error'),
        detail: this.getTranslation('File type not valid'),
        life: 3000, // Duration the toast will be visible
      });
      return;
    }
    if (file) {
      console.log('File selected:', file.name);
      this.selectedFileName = file.name; // Update the variable with the file name
      // restrict only 15 char..!
      if (this.selectedFileName.length > 15)
        this.selectedFileName = this.selectedFileName.substring(0, 15) + '..';
    }
    this.renamedProj = '';
    let projRename = {
      isRenamed: this.isRenamed, // false
      alterName: this.renamedProj, // ""
    };
    // this.projectService.setProjectCreated(true); //
    // this.projectService.setSelectedProject(file.name); //
    this.selectedFile = file;
  }

  async importFile() {
    if (!this.selectedFile) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('No file Selected to Import'),
        life: 3000, // Duration the toast will be visible
      });
      return;
    }
    const mapRename = {
      isRenamed: this.isRenamed, // false
      alterName: this.renamedProj, // ""
    };
    let project = this.projectService.getSelectedProject();
    let map = this.projectService.getMapData();
    let siteName = map && map.siteName ? map.siteName : this.defaultSite;
    const mapDetails = {
      projectId: project._id,
      siteName: siteName,
    };
    if (this.form) this.form = null;
    this.form = new FormData();
    this.form.append('mapFile', this.selectedFile);
    this.form.append('mapRename', JSON.stringify(mapRename));
    this.form.append('mapDetails', JSON.stringify(mapDetails));
    const isConflict = await this.sendZip();
    if (isConflict) {
      this.renamedProj = prompt(
        'Map with this name already exists, would you like to rename?'
      );
      if (this.renamedProj === null && this.renamedProj === '') return;
      this.isRenamed = true;
    }
  }

  async sendZip() {
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard-fs/upload-map`,
        { credentials: 'include', method: 'POST', body: this.form }
      );
      // if (!response.ok)
      //   throw new Error(`err with status code of ${response.status}`);
      let data = await response.json();
      console.log(data);
      if (data.conflicts) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 4000, // Duration the toast will be visible
        });
      }
      if (data.dupKeyErr || data.isZipValidate === false) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 3000, // Duration the toast will be visible
        });
        return;
      } else if (data.error) {
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Try Submitting again'),
          life: 3000, // Duration the toast will be visible
        });
        return;
      } else if (data.idExist) {
        this.messageService.add({
          severity: 'error',
          summary: data.msg,
          life: 3000, // Duration the toast will be visible
        });
      } else if (!data.idExist && data.nameExist) {
        return true;
      } else if (!data.error && !data.conflicts && data.isMapUploaded) {
        const { mapData } = data;
        this.showImportPopup = false;
        // let date = new Date(mapData.createdAt);
        // let createdAt = date.toLocaleString('en-IN', {
        //   month: 'short',
        //   year: 'numeric',
        //   day: 'numeric',
        //   hour: 'numeric',
        //   minute: 'numeric',
        // });

        // let uploadedMap = {
        //   id: mapData.id,
        //   mapName: mapData.mapName,
        //   siteName: mapData.siteName,
        //   date: createdAt,
        //   createdAt: mapData.createdAt,
        // };
        // this.EnvData.push(uploadedMap);
        // this.EnvData.sort(
        //   (a: any, b: any) =>
        //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        // );

        // this.filteredEnvData = [...this.EnvData];
        // this.paginatedData = [...this.EnvData];
        // this.cdRef.detectChanges();

        this.messageService.add({
          severity: 'warn',
          summary: ` ${data.msg}`,
        });
        await this.ngOnInit();
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  reloadTable() {
    this.loadData(); // Ensure data is reloaded properly
    this.setPaginatedData(); // Ensure the paginated data is set correctly after loading
    this.filterData(); // Optional if you are applying filters
    // this.resetFilters();
  }

  onChanges() {
    this.loadData();
    this.reloadTable();
    this.filterData();
    // this.setPaginatedData();
    console.log('data added');
  }

  onPopupSave() {
    this.resetFilters();
  }

  async exportMap(item: any) {
    let mapId = item.id;
    let mapName = item.mapName;

    if (!mapId) return;
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard-fs/download-map/${mapId}`,
      { credentials: 'include' }
    );
    if (!response.ok) alert('try once again');
    else {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${mapName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  // Simulation
  async startSimulation() {
    if (!this.selectedMap) return;
    try {
      this.selectedRobots = this.paginatedData1.filter(
        (item) => item.isSimMode
      );

      if (!this.selectedRobots.length) {
        this.messageService.add({
          severity: 'warn',
          summary: this.getTranslation('no robos to sim'),
        });
        return;
      }

      // customize your filter here..
      let simRobots = this.selectedRobots.map((robo) => {
        return {
          ipAdd: robo.ipAdd,
          amrId: robo.amrId,
          uuid: robo.uuid,
          roboName: robo.roboName,
        };
      });
      await this.updateSimInMap(simRobots);

      this.paginatedData1.forEach(async (robo: any) => {
        let isSim = simRobots.some(
          (simRobo: any) => simRobo.roboName === robo.roboName
        );
        await this.updateSimInRobo(robo.roboName, isSim);
      });

      this.isSimulating = true;
      alert('Robos in sim mode!');
    } catch (error) {
      console.log('Error while simulating : ', error);
    }
  }

  async updateSimInMap(simRobots: any): Promise<boolean> {
    let editedMap = {
      simMode: simRobots,
    };
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/update-map/${this.selectedMap.mapName}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedMap),
      }
    );
    let data = await response.json();
    if (data.updatedData) return true;
    return false;
  }

  async updateSimInRobo(roboName: any, isSim: boolean) {
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/${roboName}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roboName: null,
          isSimMode: isSim, // here it is..
        }),
      }
    );

    let data = await response.json();
    // console.log(data);
  }

  async fetchRobos() {
    let mapData = this.projectService.getMapData();
    // this.filteredRobotData = this.mapData;
    if (!mapData) return;
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/robo-configuration/get-robos/${mapData.id}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.status == 422) {
        console.log('Invalid map id, which request to fetch robots');
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Error'),
          detail: this.getTranslation('Invalid map id'),
          life: 4000,
        });
        return;
      }
      let data = await response.json();

      if (data.error) return;
      if (data.populatedRobos) this.robotData = data.populatedRobos;
      this.filteredRobotData = this.robotData;
      this.setPaginatedData1();
      this.reloadTable();
      // console.log(this.filteredRobotData)
      // this.filteredRobotData = data.populatedRobos;
    } catch (error) {
      console.log(error);
    }
  }

  // edit robo..
  editRobo(robo: any) {
    // console.log(robo);
    // Reset all form section visibility flags
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
    this.formData = robo.grossInfo;
    this.isPopupOpen = !this.isPopupOpen;

    // Track if we're in edit mode
    // this.isRoboInEdit = !this.isRoboInEdit;
    this.isRoboInEdit = true;

    // Store the currently edited robot for reference
    this.currEditRobo = robo;
    // this.newItem = { ...item }; // Initialize with the clicked item's data
    this.cdRef.detectChanges();
  }

  async updateRobo() {
    if (!this.formData.robotName) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Robot is not selected'),
        life: 4000,
      });
      return;
    }
    let response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/robo-configuration/${this.currEditRobo.roboName}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roboName:
            this.formData.robotName === this.currEditRobo.roboName
              ? null
              : this.formData.robotName,
          grossInfo: this.formData,
        }),
      }
    );

    let data = await response.json();
    console.log(data);
    if (data.roboExists === true) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Already exists!'),
        detail: this.getTranslation('robo with this name already exists!'),
        life: 4000,
      });
      // return;
    } else if (data.updatedData) {
      // alert('robo updated');
      this.messageService.add({
        severity: 'success',
        summary: this.getTranslation('Updated'),
        detail: this.getTranslation('Robo Details Udated Successfully'),
        life: 4000,
      });
      this.fetchRobos();
      // return;
    }
    this.setPaginatedData1();
    this.closeroboPopup();
    // console.log('line 425');
    // this.ngOnInit();
  }

  trackByTaskId(index: number, item: any): number {
    return item.taskId; // or any unique identifier like taskId
  }

  trackByTaskName(index: number, item: any): number {
    return item._id;
  }

  validateIP(ip: string): boolean {
    const ipPattern = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipPattern.test(ip);
  }

  setPaginatedData() {
    // console.log('paginated data called');
    if (this.currentTable === 'Environment') {
      const pageSize = this.paginator?.pageSize || 5; // Default pageSize to 5 if paginator is not yet available
      const pageIndex = this.paginator?.pageIndex || 0; // Default pageIndex to 0 (first page)

      // Paginate the data based on current page and page size
      const startIndex = pageIndex * pageSize;
      const endIndex = startIndex + pageSize;

      this.paginatedData = this.filteredEnvData.slice(startIndex, endIndex);
      // console.log(this.filteredRobotData);

      // Optionally, ensure that the paginator reflects the right page size and length
      if (this.paginator) {
        this.paginator.length = this.filteredEnvData.length;
        // console.log(this.filteredRobotData);
      }
    }
  }

  setPaginatedData1() {
    if (this.currentTable === 'robot') {
      const pageSize1 = this.paginator?.pageSize || 5; // Default pageSize to 5 if paginator is not yet available
      let pageIndex1 = this.paginator?.pageIndex || 0; // Default pageIndex to 0 (first page)

      // Ensure that we reset to the first page if the page becomes empty after deletion
      const totalItems = this.filteredRobotData.length;
      const totalPages = Math.ceil(totalItems / pageSize1);

      // If the current page index exceeds the total number of pages after deletion, reset to page 1
      if (this.paginator && pageIndex1 >= totalPages) {
        pageIndex1 = 0;
        this.paginator.pageIndex = pageIndex1;
      }

      // Paginate the data based on the current page and page size
      const startIndex = pageIndex1 * pageSize1;
      const endIndex = startIndex + pageSize1;

      // Update the paginated data with the sliced portion of the data array
      this.paginatedData1 = this.filteredRobotData.slice(startIndex, endIndex);

      // console.log(this.filteredRobotData);

      // Ensure the paginator reflects the correct page size and total data length
      if (this.paginator) {
        this.paginator.length = this.filteredRobotData.length;
        // console.log(this.filteredRobotData);
      }
    }
  }

  // Ensure pagination is triggered on page change
  onPageChange(event: PageEvent) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.setPaginatedData(); // Update paginated data on page change
  }
  onPageChanges(event: PageEvent) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.setPaginatedData1();
    this.fetchRobos();
  }

  //Commit Changed
  // Search method
  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase();

    if (!inputValue) {
      this.filteredEnvData = this.EnvData;
      this.filteredRobotData = this.robotData;
    } else {
      this.filteredEnvData = this.EnvData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
      this.filteredRobotData = this.robotData.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(inputValue)
        )
      );
    }

    // Reset the paginator after filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.paginatedData1 = this.filteredRobotData;

    this.setPaginatedData(); // Update paginated data after filtering
  }

  async selectMap(map: any) {
    // console.log('select deselected clicked')
    // let mapStatus=this.projectService.getInitializeMapSelected()
    this.projectService.setInitializeMapSelected(true);
    // Deselect if the same map is clicked again
    if (this.selectedMap?.id === map.id) {
      this.projectService.clearMapData();
      this.projectService.setInitializeMapSelected(false); // confirm it..
      this.projectService.setIsMapSet(false);
      if (!this.EnvData.length) return;
      this.selectedMap = this.EnvData[0];
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${this.EnvData[0]?.mapName}`
      );
      if (!response.ok)
        console.error('Error while fetching map data : ', response.status);
      let data = await response.json();
      // let { map } = data;
      await this.ngOnInit();

      // if (this.projectService.getIsMapSet()) return; // yet to uncomment..
      // this.projectService.setIsMapSet(true);
      return;
    }
    // Select a new map
    this.selectedMap = map;
    await this.loadMapData(map);

    // Store the selected map in localStorage or service
    if (this.selectedMap) {
      localStorage.setItem('selectedMapId', this.selectedMap.id); // no need any more ig..
      this.messageService.add({
        severity: 'success',
        summary: `${map.mapName}`,
        detail: this.getTranslation('Map Successfully loaded'),
      });
    } else {
      localStorage.removeItem('selectedMapId');
    }
  }

  private async loadMapData(map: any) {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok)
      console.error('Error while fetching map data : ', response.status);
    let data = await response.json();

    this.projectService.setMapData({
      ...map,
      imgUrl: data.map.imgUrl,
    });

    if (this.projectService.getIsMapSet()) return;
    this.projectService.setIsMapSet(true);
  }
  // This method can be called when the component is initialized or when a new map is created
  private selectFirstMapIfNoneSelected() {
    if (!this.selectedMap && this.EnvData.length > 0) {
      this.selectMap(this.EnvData[0]);
    }
  }

  async getMapImgUrl(map: any): Promise<any> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok)
      console.error('Error while fetching map data : ', response.status);
    let data = await response.json();
    if (!data.error) return data.map.imgUrl;
  }

  isButtonDisabled(item: any): boolean {
    return this.selectedMap?.id === item.id;
  }

  ngOnChanges() {
    this.filterData();
  }

  isTypeSpecificationFormVisible = false;
  isProtocolLimitsFormVisible = false;
  isProtocolFeaturesFormVisible = false;
  isAGVGeometryFormVisible = false;
  isLoadSpecificationFormVisible = false;
  isLocalizationParametersFormVisible = false;

  normalizeDate(date: Date): string {
    return this.formatDate(date); // Strips time information, returns 'YYYY-MM-DD'
  }

  selectedrobotData = [
    { column1: '192.168.XX.XX', column2: ' ' },
    { column1: '192.168.XX.XX', column2: ' ' },
  ];
  ipScanData: any[] = [];

  loadData() {
    // Fetch or initialize data here
    // this.EnvData = []; // Replace with actual data fetching
    this.setPaginatedData(); //changes made for Realoading the Data
    this.filterData(); // Initial filter application
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.setPaginatedData(); // Safe to access paginator here
      this.setPaginatedData1();
    }
  }

  drawConnectivity() {
    const canvas = this.uploadedCanvas?.nativeElement;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const [start, end] = this.connectivityPoints;
    if (start && end) {
      // Draw a line between the two points
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      // Set line style
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw arrow or other indication if needed
      // (optional, for visualization)
    }
  }
  isRobotPopupVisible: boolean = false;
  eventSource!: EventSource;
  startIP: string = '';
  EndIP: string = '';
  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.paginatedData1.forEach((item) => (item.selected = isChecked));
  }

  async startScanning() {
    this.ipScanData = [];
    if (this.validateIP(this.startIP) && this.validateIP(this.EndIP)) {
      console.log('IP range is valid');
    } else {
      console.log('Invalid IP addresses');
    }

    if (this.startIP === '' || this.EndIP === '') {
      this.setPaginatedData();
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Error'),
        detail: this.getTranslation('Enter valid IP'),
      });
      return;
    }

    const ipv4Regex =
      /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(this.startIP) || !ipv4Regex.test(this.EndIP)) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Error'),
        detail: this.getTranslation('Not valid IP. Try again'),
      });
      return;
    }

    const URL = `http://${environment.API_URL}:${environment.PORT}/fleet-config/scan-ip/${this.startIP}-${this.EndIP}`;

    const response = await fetch(URL, { method: 'GET' });

    if (response.status === 422) {
      // alert(`Ip range is too large`);
      this.messageService.add({
        severity: 'warn',
        summary: this.getTranslation('Warning'),
        detail: this.getTranslation('IP range is too large'),
      });
      return;
    }

    if (this.eventSource) this.eventSource.close();

    this.eventSource = new EventSource(URL);
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        let poll: Poll = {
          ip: data.ip_address,
          mac:
            data.mac_address === '' || data.mac_address === 'undefined'
              ? '00:00:00:00:00:00'
              : data.mac_address,
          host: data.host,
          ping: data.time,
          // hostname:data.hostname,
          Status: data.status,
        };
        // console.log(poll);

        if (poll.Status === 'online')
          this.ipScanData = [...this.ipScanData, poll];
        // this.ipScanData = this.filteredipData;
        // this.setPaginatedData();
        this.cdRef.detectChanges();
      } catch (error) {
        console.error('Error parsing SSE data:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Error'),
          detail: `${error}`,
        });
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource.close();
      this.messageService.add({
        severity: 'success',
        summary: this.getTranslation('Completed'),
        detail: this.getTranslation('Scanning Completed'),
      });
      this.isScanning = false;
      this.cdRef.detectChanges();
    };
    this.isScanning = true;
    if (this.isScanning)
      this.messageService.add({
        severity: 'info',
        summary: this.getTranslation('Info'),
        detail: this.getTranslation('Started scanning'),
      });
  }
  stopScanning() {
    this.isScanning = false;
    this.eventSource.close();
    this.messageService.add({
      severity: 'error',
      summary: this.getTranslation('Info'),
      detail: this.getTranslation('Scanning Stopped'),
    });
    return;
  }

  robots = [
    { id: 1, name: 'Robot A' },
    { id: 2, name: 'Robot B' },
  ];

  selectedRobots: any[] = [];
  showRobotPopup() {
    this.isRobotPopupVisible = true;
  }

  closeRobotPopup() {
    this.isRobotPopupVisible = false;
  }
  showRobotParametersPopup = false;
  openRobotParametersPopup() {
    this.showRobotParametersPopup = true;
  }
  closeRobotParametersPopup() {
    this.showRobotParametersPopup = false;
  }
  showImageUploadPopup = false;
  openImageUploadPopup(): void {
    this.currEditMap = false;
    // Reset the search filters
    this.startDate = null;
    this.endDate = null;
    this.searchTerm = ''; // If you have a search term, reset it as we
    this.showImageUploadPopup = true;
    this.setPaginatedData();
    this.filterData();
    this.resetFilters();
  }
  showImportPopup = false;
  openMapImportPopup(): void {
    this.showImportPopup = true;
  }
  closeImageUploadPopup(): void {
    this.showImageUploadPopup = false;
  }
  updateMapDetails(event: { mapName: string; siteName: string }) {
    const { mapName, siteName } = event;
    if (mapName && siteName) {
      const newEntry = {
        mapName,
        siteName,
        lastCreated: new Date().toLocaleDateString(),
      };
      this.filteredEnvData.push(newEntry);
    }
  }

  showIPScannerPopup = false;

  openIPScanner() {
    this.showIPScannerPopup = true;
  }

  closeIPScanner() {
    this.showIPScannerPopup = false;
  }

  connectivity() {
    this.isConnectivityModeActive = true; // Enable connectivity mode
    this.connectivityPoints = []; // Clear previous points
    console.log('Connectivity mode activated. Select two points.');
  }

  connectivityMode: 'none' | 'bi-directional' | 'uni-directional' = 'none';
  firstPoint: { x: number; y: number } | null = null;
  secondPoint: { x: number; y: number } | null = null;

  addEnvironmentData() {
    const newEntry = {
      // mapName: this.mapName,
      // siteName: this.siteName,
      date: formatDate(new Date(), 'MMM d, yyyy. HH:mm:ss', 'en-US'),
    };

    this.EnvData.push(newEntry);
    this.filteredEnvData = [...this.EnvData];
    this.setPaginatedData();
  }

  isCalibrationLayerVisible = false;

  showCalibrationLayer() {
    this.isCalibrationLayerVisible = true;
  }

  hideCalibrationLayer() {
    this.isCalibrationLayerVisible = false;
  }

  addNode() {
    console.log('Add Node clicked');
  }

  zones() {
    console.log('Zones clicked');
  }

  addAssets() {
    console.log('Add Assets clicked');
  }

  addRobots() {
    console.log('Add Robots clicked');
  }

  removeRobots() {
    console.log('Remove Robots clicked');
  }

  setActiveButton(button: string) {
    this.activeButton = button;
    // this.currentTable = button;
    // this.activeHeader = header;
    this.isTransitioning = true;
    this.filterData();
    this.setPaginatedData();
    this.activeButton = button;
    this.activeHeader = this.getHeader(button);
    this.isTransitioning = false;

    // Set the current table and tab based on the button
    if (button === 'fleet') {
      this.currentTable = 'fleet';
      this.currentTab = 'fleet';
    } else {
      this.currentTable = button;
      this.currentTab = button;
    }
  }

  setFleetTab(tab: string): void {
    this.fleetTab = tab;
  }

  startDate: Date | null = null;
  endDate: Date | null = null;
  minDate!: string;
  maxDate!: string;

  // yet to work..
  showTable(table: string) {
    this.currentTable = table;
    this.setPaginatedData();
    this.filterData();
    this.searchTerm = ''; // Clear the search term
    this.startDate = null; // Clear the start date
    this.endDate = null; // Clear the end date

    // Clear filtered data based on the current table
    if (this.currentTable === 'environment') {
      this.filteredEnvData = [...this.EnvData]; // Reset to the original data
    } else if (this.currentTable === 'robot') {
      this.filteredRobotData = [...this.robotData]; // Reset to the original data
      this.fetchRobos();
    }
    // this.filterData();
  }
  searchTermChanged() {
    this.filterData();
  }

  filterData() {
    const term = this.searchTerm.toLowerCase();

    if (this.currentTable === 'Environment') {
      this.filteredEnvData = this.EnvData.filter((item) => {
        const date = new Date(item.date);
        const normalizedDate = this.normalizeDate(date); // Normalize the item's date
        const withinDateRange =
          (!this.startDate ||
            normalizedDate >= this.normalizeDate(this.startDate)) &&
          (!this.endDate || normalizedDate <= this.normalizeDate(this.endDate)); // Normalize the end date

        return (
          (item.mapName.toLowerCase().includes(term) ||
            item.siteName.toLowerCase().includes(term) ||
            item.date.toLowerCase().includes(term)) &&
          withinDateRange
        );
      });
      // console.log(this.startDate);
      // console.log(this.endDate);

      // Reset paginator to the first page and update paginated data
      if (this.paginator) {
        this.paginator.pageIndex = 0; // Reset to the first page after filtering
      }
      // this.ngOnInit();
      this.setPaginatedData(); // Trigger pagination logic after filtering
    }
  }

  resetFilters() {
    this.searchTerm = ''; // Reset search term
    this.startDate = null; // Reset start date
    this.endDate = null; // Reset end date
    this.filteredEnvData = [...this.EnvData]; // Reset environment data filter
    this.filteredRobotData = [...this.robotData]; // Reset robot data filter
  }

  // Function to format date to 'YYYY-MM-DD' format for input type="date"
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDateChange(value: string, field: 'start' | 'end') {
    //new
    if (field === 'start') {
      this.startDate = value ? new Date(value) : null;
    } else if (field === 'end') {
      this.endDate = value ? new Date(value) : null;
    }
    this.filterData(); // Call filter logic after date change
  }

  setCurrentTable(table: string) {
    this.currentTable = table;
  }

  getCurrentTableData() {
    switch (this.currentTable) {
      case 'Environment':
        return this.EnvData;
      case 'robot':
        return this.robotData;
      default:
        return [];
    }
  }

  getHeader(button: string): string {
    switch (button) {
      case 'Environment':
        return this.getTranslation('Environment');
      case 'robot':
        return this.getTranslation('Robot');
      case 'fleet':
        return this.getTranslation('Fleet');
      default:
        return this.getTranslation('Environment');
    }
  }

  showPopup() {
    this.isPopupVisible = true;
  }

  onCurrEditMapChange(currEditMap: boolean) {
    this.currEditMap = currEditMap;
  }
  editItem(item: any) {
    this.editLoader = true;
    if (this.currEditMap) {
      this.currEditMap = true;
    }
    fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${item.mapName}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (!data.map) {
          this.messageService.add({
            severity: 'warn',
            summary: this.getTranslation('Warning'),
            detail: this.getTranslation('Map does not exist.'),
          });
          return;
        }

        if (data.error) {
          this.messageService.add({
            severity: 'error',
            summary: this.getTranslation('Error fetching map'),
            detail: `${data.error}`,
          });
          return;
        }

        const { map } = data;
        const mapImgUrl = `http://${environment.API_URL}:${environment.PORT}/${map.imgUrl}`;

        // Check if the image URL is accessible
        this.checkImageLoading(mapImgUrl)
          .then(() => {
            // Proceed only if the image loads successfully
            this.currEditMapDet = {
              mapName: map.mapName,
              siteName: item.siteName,
              ratio: map.mpp,
              imgUrl: mapImgUrl,
              origin: map.origin,
              nodes: map.nodes,
              edges: map.edges,
              assets: map.stations,
              zones: map.zones,
              robos: map.roboPos,
            };
            this.currEditMap = true;
            this.showImageUploadPopup = true;
            this.editLoader = false;

            this.messageService.add({
              severity: 'success',
              summary: this.getTranslation('Success'),
              detail: this.getTranslation('Map data loaded successfully.'),
            });
          })
          .catch(() => {
            // Handle the case where the image fails to load
            this.messageService.add({
              severity: 'error',
              summary: this.getTranslation('Error'),
              detail: this.getTranslation(
                'Failed to load map image. Please check the image URL or cookies.'
              ),
            });
          });
      })
      .catch((err) => {
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Error'),
          detail: this.getTranslation(
            'An error occurred while fetching map data.'
          ),
        });
      });
  }

  // Helper method to check if an image URL loads successfully
  private checkImageLoading(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;

      img.onload = () => resolve(); // Image loaded successfully
      img.onerror = () => reject(); // Error loading the image
    });
  }

  async deleteMap(map: any): Promise<boolean> {
    try {
      const response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map.mapName}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            projectName: this.mapData?.projectName,
            siteName: map.siteName,
          }),
        }
      );
      // if (!response.ok)
      //   console.error('Error while fetching map data : ', response.status);
      let data = await response.json();
      if (data.isDeleted) return true;
      if (data.isMapExist === false) {
        this.messageService.add({
          severity: 'warn',
          summary: `${data.msg}`,
        });
        return false;
      }
      return false;
    } catch (error) {
      console.log('Err occured : ', error);
      console.error('Error occurred: ', error);
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Error'),
        detail: this.getTranslation(
          'An error occurred while deleting the map.'
        ),
      });
      return false;
    }
  }

  showConfirmationDialog: boolean = false;
  itemToDelete: any;

  openDeleteConfirmation(item: any) {
    this.itemToDelete = item;
    this.showConfirmationDialog = true;
  }

  confirmDelete() {
    this.showConfirmationDialog = false;
    this.deleteItemConfirmed(this.itemToDelete);
    this.deleteRobo(this.itemToDelete);
  }
  deleteRobo(robo: any) {
    if (robo) {
      let project = this.projectService.getSelectedProject();
      let map = this.projectService.getMapData();
      let roboInfo = {
        amrId: robo.amrId,
        roboId: robo._id,
        projectName: project.projectName,
        mapName: map.mapName,
      };

      // Perform the delete operation
      fetch(
        `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roboInfo),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.isRoboExists) {
            this.messageService.add({
              severity: 'success',
              summary: this.getTranslation('Success'),
              detail: this.getTranslation('Robot deleted successfully!'),
              life: 4000,
            });
            this.fetchRobos(); // Refresh the list of robots
            this.setPaginatedData1(); // Update the paginator data
            this.cdRef.detectChanges(); // Trigger change detection
          } else {
            this.messageService.add({
              severity: 'error',
              summary: this.getTranslation('Error'),
              detail: this.getTranslation('Failed to delete the robot.'),
              life: 4000,
            });
          }
        })
        .catch((error) => {
          console.error(error);
          this.messageService.add({
            severity: 'error',
            summary: this.getTranslation('Error'),
            detail: this.getTranslation(
              'An error occurred while deleting the robot.'
            ),
            life: 4000,
          });
        });
    }
  }

  cancelDelete() {
    this.showConfirmationDialog = false;
    this.itemToDelete = null;
    this.showImportPopup = false;

    this.form = null;
    this.selectedFile = null;
    this.selectedFileName = this.getTranslation('import_map_file');
    // if (!this.isProjDiv2Visible) {
    //   this.selectedFileName = 'Import Project File';
    // }
  }

  deleteItemConfirmed(item: any) {
    let isDeleted = false;

    this.deleteMap(item).then((result) => {
      isDeleted = result;
      if (isDeleted) {
        if (
          this.projectService.getMapData() &&
          item.id === this.projectService.getMapData().id
        ) {
          this.projectService.setIsMapSet(false);
          this.projectService.clearMapData();
          this.projectService.setInitializeMapSelected(false); // confirm it.
        }

        if (this.currentTable === 'Environment') {
          this.EnvData = this.EnvData.filter((i) => i !== item);
          this.filteredEnvData = this.EnvData;
          this.cdRef.detectChanges();
        } else if (this.currentTable === 'robot') {
          this.filteredRobotData = this.robotData.filter((i) => i !== item);
          this.cdRef.detectChanges();
          this.reloadTable();
          this.setPaginatedData();
        }

        // console.log('line 1438');
        this.ngOnInit();
        this.reloadTable();
        // console.log(this.paginatedData, 'page data');
        if (this.paginatedData.length == 0) {
          this.projectService.setInitializeMapSelected(false);
        }
        console.log('Item deleted:', item);
        // console.log(this.paginatedData1,'2page data')
        this.messageService.add({
          severity: 'success',
          summary: this.getTranslation('Deleted'),
          detail: this.getTranslation('Item successfully deleted!'),
        });
      }
    });
  }

  addItem(item: any) {
    console.log('Add item:', item);
    this.messageService.add({
      severity: 'info',
      summary: this.getTranslation('Add Item'),
      detail: this.getTranslation('Item added successfully.'),
    });
  }

  blockItem(item: any) {
    console.log('Block item:', item);
    this.messageService.add({
      severity: 'warn',
      summary: this.getTranslation('Block Item'),
      detail: this.getTranslation('Item blocked.'),
    });
  }

  isPPPopupOpen: boolean = false;
  newItem: any = {};
  isPhysicalParametersFormVisible: boolean = false;
  // isTypeSpecificationFormVisible = false;
  // isProtocolLimitsFormVisible = false;
  // isProtocolFeaturesFormVisible = false;
  // isAGVGeometryFormVisible = false;
  // isLoadSpecificationFormVisible = false;
  // isLocalizationParametersFormVisible = false;
  formData = {
    robotName: '',
    manufacturer: '',
    serialNumber: '',
    attachmentType: 'NOT_SET',
    typeSpecification: {
      seriesName: '',
      seriesDescription: '',
      agvKinematic: '',
      agvClass: '',
      maxLoadMass: 0,
      localizationTypes: '',
      navigationTypes: '',
    },
    protocolLimits: {
      maxStringLens: '',
      maxArrayLens: '',
      timing: '',
    },
    protocolFeatures: {
      optionalParameters: '',
      actionScopes: '',
      actionParameters: '',
      resultDescription: '',
    },
    agvGeometry: {
      wheelDefinitions: '',
      envelopes2d: '',
      envelopes3d: '',
    },
    loadSpecification: {
      loadPositions: '',
      loadSets: '',
    },
    localizationParameters: {
      type: '',
      description: '',
    },
  };
  reset() {
    this.formData = {
      robotName: '',
      manufacturer: '',
      serialNumber: '',
      attachmentType: 'NOT_SET',
      typeSpecification: {
        seriesName: '',
        seriesDescription: '',
        agvKinematic: '',
        agvClass: undefined as any | undefined,
        maxLoadMass: 0,
        localizationTypes: '',
        navigationTypes: '',
      },
      protocolLimits: {
        maxStringLens: '',
        maxArrayLens: '',
        timing: '',
      },
      protocolFeatures: {
        optionalParameters: '',
        actionScopes: '',
        actionParameters: '',
        resultDescription: '',
      },
      agvGeometry: {
        wheelDefinitions: '',
        envelopes2d: '',
        envelopes3d: '',
      },
      loadSpecification: {
        loadPositions: '',
        loadSets: '',
      },
      localizationParameters: {
        type: '',
        description: '',
      },
    };
  }

  // cities: any[] | undefined;

  // selectedCity: DB | undefined;

  // Method to close all forms
  closeAllForms(): void {
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
  }

  // Toggle Type Specification Form
  toggleTypeSpecificationForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isTypeSpecificationFormVisible = !this.isTypeSpecificationFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Protocol Limits Form
  toggleProtocolLimitsForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isProtocolLimitsFormVisible = !this.isProtocolLimitsFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Protocol Features Form
  toggleProtocolFeaturesForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isProtocolFeaturesFormVisible = !this.isProtocolFeaturesFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle AGV Geometry Form
  toggleAGVGeometryForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isAGVGeometryFormVisible = !this.isAGVGeometryFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Load Specification Form
  toggleLoadSpecificationForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isLoadSpecificationFormVisible = !this.isLoadSpecificationFormVisible;
    this.cdRef.detectChanges();
  }

  // Toggle Localization Parameters Form
  toggleLocalizationParametersForm(event: Event): void {
    event.preventDefault();
    this.closeAllForms();
    this.isLocalizationParametersFormVisible =
      !this.isLocalizationParametersFormVisible;
    this.cdRef.detectChanges();
  }

  // Close form methods (if needed individually)
  closeTypeSpecificationForm(): void {
    this.isTypeSpecificationFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeProtocolLimitsForm(): void {
    this.isProtocolLimitsFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeProtocolFeaturesForm(): void {
    this.isProtocolFeaturesFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeAGVGeometryForm(): void {
    this.isAGVGeometryFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeLoadSpecificationForm(): void {
    this.isLoadSpecificationFormVisible = false;
    this.cdRef.detectChanges();
  }

  closeLocalizationParametersForm(): void {
    console.log('Close icon clicked');
    this.isLocalizationParametersFormVisible = false;
    this.cdRef.detectChanges();
  }

  // Save methods for each form
  saveTypeSpecification(): void {
    console.log('Type Specification saved:', this.formData.typeSpecification);
    this.closeTypeSpecificationForm();
    // this.cdRef.detectChanges();
  }

  saveProtocolLimits(): void {
    console.log('Protocol Limits saved:', this.formData.protocolLimits);
    this.closeProtocolLimitsForm();
    this.cdRef.detectChanges();
  }

  saveProtocolFeatures(): void {
    console.log('Protocol Features saved:', this.formData.protocolFeatures);
    this.closeProtocolFeaturesForm();
    this.cdRef.detectChanges();
  }

  saveAGVGeometry(): void {
    console.log('AGV Geometry saved:', this.formData.agvGeometry);
    this.closeAGVGeometryForm();
    this.cdRef.detectChanges();
  }

  saveLoadSpecification(): void {
    console.log('Load Specification saved:', this.formData.loadSpecification);
    this.closeLoadSpecificationForm();
    this.cdRef.detectChanges();
  }

  saveLocalizationParameters(): void {
    console.log(
      'Localization Parameters saved:',
      this.formData.localizationParameters
    );
    this.closeLocalizationParametersForm();
    this.cdRef.detectChanges();
  }

  saveItem(): void {
    this.isPopupOpen = false;

    this.cdRef.detectChanges();
  }

  // handle the data here..
  async saveRoboInfo(): Promise<void> {
    // roboName | serial Number, ip add, mac add, grossInfo
    let project = this.projectService.getSelectedProject();
    let currMap = this.projectService.getMapData();

    if (!project || !currMap) {
      this.messageService.add({
        severity: 'warn',
        summary: this.getTranslation('Map not selected'),
      });
      return;
    }

    if (this.isRoboInEdit) {
      this.updateRobo();
      return;
    }
    let amrId = 0;
    if (this.robotData.length)
      amrId = this.robotData[this.robotData.length - 1].amrId + 1;
    const dateInSecs = Math.round(Date.now() / 1000);
    let uuid = parseInt(dateInSecs.toString().slice(-8));

    const roboDetails = {
      projectName: project.projectName,
      mapId: currMap.id,
      mapName: currMap.mapName,
      roboName: this.formData.robotName,
      amrId: amrId,
      uuid: uuid,
      // isSimMode : false,
      ipAdd: this.currentRoboDet.ip,
      macAdd: this.currentRoboDet.mac,
      grossInfo: this.formData,
    };
    if (roboDetails.roboName === '' || this.formData.manufacturer === '') {
      this.messageService.add({
        severity: 'warn',
        summary: this.getTranslation('Warning'),
        detail: this.getTranslation(
          'Manufacturer or roboname should be Entered'
        ),
      });
      return;
    }
    try {
      let response = await fetch(
        `http://${environment.API_URL}:${environment.PORT}/robo-configuration`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(roboDetails),
        }
      );
      this.isPopupOpen = false;
      if (response.status === 422)
        console.log(
          'Error while inserting reference Id in server, unprocessable entity'
        );
      // if (!response.ok)
      //   throw new Error(`Err with status code of ${response.status}`);
      let data = await response.json();
      if (data.error) return;
      else if (data.isIpMacExists) {
        console.log(data.msg);

        this.messageService.add({
          severity: 'warn',
          summary: this.getTranslation('Warning'),
          detail: this.getTranslation('IP | Mac seems already exists!'),
        });
        return;
      } else if (data.exists) {
        // alert('Robo Name already exists');
        this.messageService.add({
          severity: 'warn',
          summary: this.getTranslation('Warning'),
          detail: this.getTranslation('Robo Name already exists'),
        });
        return;
      }
      if (data.robo) {
        this.fetchRobos();
        // this.robotData = [...this.robotData, data.robo];
        // this.filteredRobotData = [...this.robotData];
        // this.setPaginatedData1();
        this.cdRef.detectChanges();
        this.messageService.add({
          severity: 'success',
          summary: this.getTranslation('Success'),
          detail: this.getTranslation('Robo Added to Database Successfully!.'),
        });
        return;
      }
    } catch (error) {
      console.log(error);
    }

    this.isPopupOpen = false;
    // this.cdRef.detectChanges();
  }

  closeroboPopup(): void {
    this.isPopupOpen = false;
    this.cdRef.detectChanges();
  }

  openPopup(item: any) {
    // Reset all form section visibility flags
    this.isRoboInEdit = false;
    this.isTypeSpecificationFormVisible = false;
    this.isProtocolLimitsFormVisible = false;
    this.isProtocolFeaturesFormVisible = false;
    this.isAGVGeometryFormVisible = false;
    this.isLoadSpecificationFormVisible = false;
    this.isLocalizationParametersFormVisible = false;
    this.currentRoboDet = item;
    this.isPopupOpen = !this.isPopupOpen;
    this.reset();
    // this.newItem = { ...item }; // Initialize with the clicked item's data
    this.cdRef.detectChanges();
  }
  closePPPopup() {
    this.isPhysicalParametersFormVisible =
      !this.isPhysicalParametersFormVisible;
  }
  savePPItem() {
    this.isPhysicalParametersFormVisible =
      !this.isPhysicalParametersFormVisible;
  }

  // simulation robots

  isMapAvailable(): boolean {
    return this.selectedMap != null && this.selectedMap.mapName != null;
  }

  async togglePopup() {
    console.log('Selected Map:', this.selectedMap);

    if (!this.isMapAvailable()) {
      console.log('Map is not available, showing alert.');
      this.messageService.add({
        severity: 'warn',
        summary: this.getTranslation(
          'Please create or select a map to simulate the robots.'
        ),
      });
      return;
    }

    let simRobos = await this.getSimRobos(this.selectedMap);
    this.totalRobots = simRobos ? simRobos.length : 0;
    this.isPopupVisible = !this.isPopupVisible;
  }

  robotCount: number = 0;
  totalRobots: number = 0;

  async getSimRobos(map: any): Promise<any> {
    const response = await fetch(
      `http://${environment.API_URL}:${environment.PORT}/dashboard/maps/${map?.mapName}`
    );
    if (!response.ok) {
      console.error('Error while fetching map data : ', response.status);
      return;
    }
    let data = await response.json();
    if (!data.error) return data.map.simMode;
  }
  closePopup() {
    this.isPopupVisible = false;
    this.isImageOpened = false;
    this.chosenImageName = '';
    this.imageHeight = 0;
    this.imageWidth = 0;
    this.robotCountError = false;
    this.robotCount = 0;
  }

  robotCountError: boolean = false;
  async addRobot() {
    // Check for valid robot count
    if (this.robotCount <= 0) {
      this.robotCountError = true;
      return;
    }

    // Limit to a maximum of 10 robots in total
    if (this.robotCount + this.totalRobots > 10) {
      this.messageService.add({
        severity: 'error',
        summary: this.getTranslation('Error'),
        detail: this.getTranslation('Total robots cannot exceed 10.'),
        life: 4000,
      });

      return;
    }

    // Fetch the current simRobos data to retain existing robots
    let existingSimRobos = (await this.getSimRobos(this.selectedMap)) || [];

    // Create new robots based on robotCount
    let newRobots = [];
    for (let i = 0; i < this.robotCount; i++) {
      newRobots.push({
        amrId: existingSimRobos.length + i, // ID based on total robots
        roboName: `MR${existingSimRobos.length + i}00`, // Unique name
        enable: false,
        isInitialized: false,
        imgState: '',
        pos: { x: existingSimRobos.length + i, y: 0, orientation: 0 },
      });
    }

    // Combine existing robots with the new robots
    const updatedSimRobos = [...existingSimRobos, ...newRobots];

    // Update the map with the new list of robots
    let sims = await this.updateSimInMap(updatedSimRobos);
    if (sims) {
      this.messageService.add({
        severity: 'info',
        summary: this.getTranslation('Info'),
        detail: this.getTranslation('Robots are added for Simulation'),
        life: 4000,
      });
    }

    this.robotCountError = false;
    // Update the totalRobots count to reflect all robots now in sim mode
    this.totalRobots = updatedSimRobos.length;

    // Reset the robotCount input field
    this.robotCount = 0;
  }

  async clearAllRobots() {
    try {
      if (this.totalRobots === 0) {
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Error'),
          detail: this.getTranslation('No Robots to Delete'),
          life: 4000,
        });
        return;
      }

      // Set the robots list to an empty array to clear all robots
      const updatedSimRobos: any[] = [];

      // Update the backend with the empty list of robots
      let result = await this.updateSimInMap(updatedSimRobos);
      if (result) {
        this.messageService.add({
          severity: 'info',
          summary: this.getTranslation('Info'),
          detail: this.getTranslation('All robots deleted!'),
          life: 4000,
        });

        // Reset the local totalRobots count
        this.totalRobots = 0;
      } else {
        console.error('Failed to clear robots on the backend.');
      }
    } catch (error) {
      console.error('Error during clearing robots:', error);
    }
  }

  async deleteRobot(amrId: number) {
    try {
      if (this.totalRobots === 0) {
        this.messageService.add({
          severity: 'error',
          summary: this.getTranslation('Error'),
          detail: this.getTranslation('No Robots to Delete'),
          life: 4000,
        });
        return;
      }

      // Fetch the current simRobos data
      let existingSimRobos = (await this.getSimRobos(this.selectedMap)) || [];

      // Check if the robot with the given amrId exists
      const robotToDelete = existingSimRobos.find(
        (robot: { amrId: number }) => robot.amrId === amrId
      );
      if (!robotToDelete) {
        this.messageService.add({
          severity: 'warn',
          summary: `Robot with ID ${amrId} not found.`,
        });
        return;
      }

      // Filter out the robot to be deleted
      const updatedSimRobos = existingSimRobos.filter(
        (robot: { amrId: number }) => robot.amrId !== amrId
      );
      // Update the backend with the updated list of robots
      let result = await this.updateSimInMap(updatedSimRobos);
      if (result) {
        this.messageService.add({
          severity: 'warn',
          summary: `Robot with ID ${amrId} deleted!`,
        });
        // Update the local totalRobots count
        this.totalRobots = updatedSimRobos.length;
      } else {
        alert('Failed to delete the robot from the backend.');
      }
    } catch (error) {
      console.error('Error during robot deletion:', error);
    }
  }
}
