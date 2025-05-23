import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogServiceStatusComponent } from 'src/app/dialogs/dialog-service-status/dialog-service-status.component';
import { ServicesService } from 'src/app/services/services.service';
import { DynamicTableComponent } from '../../library/dynamic-table/dynamic-table.component';
import { MasterService } from 'src/app/services/master.service';
import { PersonService } from 'src/app/services/person.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { MytoastrService } from 'src/app/services/mytoastr';

@Component({
  selector: 'uni-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {

  public columns: any[] = [
    { 'name': 'Nombre', 'attribute': 'name' },
    { 'name': 'Descripción', 'attribute': 'description' },
    { 'name': 'Tipo de servicio', 'attribute': 'serviceTypeName'},
    { 'name': 'Proveedor', 'attribute': 'idProvider'},
    { 'name': 'Cliente', 'attribute': 'idClient'},
    { 'name': 'Estado', 'attribute': 'status','config':{
      'styleClass':true
    }},
  ];
  public options: any[] = [
    { value: 'Servicio', id:'1'},
    { value: 'Entidad-Servicio', id:'2'},
    { value: 'Client-Servicio', id:'3'},
  ]

  public pageSize: any = 5;
  public pageKey: any[];
  public close : boolean = false;
  public serviceForm!: FormGroup;
  public dataFilter : any;
  public dataService : any[];
  public functionDataCurrent: (pageSize: any) => any;
  public disabledEditOption: any
  public editOption: any;
  public selectedIds: any;
  public stateMaster: any;
  public idClient : any;
  public idProvider : any;
  public dataIdService : any;
  public optionId:any


  @ViewChild(DynamicTableComponent) dynamic!: DynamicTableComponent;

  constructor(
    private router : Router,
    private services : ServicesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private service : ServicesService,
    private master : MasterService,
    private person : PersonService,
    private spinner : SpinnerService,
    private mytoastr : MytoastrService
  ) { }

  ngOnInit(): void {
    this.formService();
    this.dataMaster();
      // Suscribirse a cambios y convertir a mayúsculas
  this.service_name?.valueChanges.subscribe(value => {
    if (value) {
      this.service_name?.setValue(value.toUpperCase(), { emitEvent: false });
    }
  });

  this.dataInitial();

  }

  dataInitial(){
    this.spinner.spinnerOnOff();
    this.service.getServicesData().subscribe({
      next:(value) =>{
        this.dataService = value.data.Items.map(item => ({
          ...item,
          serviceTypeName: item.serviceType?.name || ''
        }));
      },
      error:(err)=> {
        this.mytoastr.showError("Error al cargar servicios","")
        console.error("Error", err)
          this.spinner.spinnerOnOff()
      },
      complete:()=> {
          this.spinner.spinnerOnOff();
      },
    })
  }


  formService(){
    this.serviceForm = this.fb.group({
      service_name : [''],
      status:['']
    })
  }

  addService(){
    this.router.navigate(['service/add'])
  }

  searchData(){
    if(this.service_name.value == '' || this.service_name.value == undefined){
      this.mytoastr.showWarning('Ingrese un valor válido','')
      return
    }
    const input = this.service_name.value.toUpperCase();
    // console.log("busqueda_ 0",input)
    this.spinner.spinnerOnOff();
    // return
    this.services.getServices(input).subscribe({
      next : (data) => {
        if(data.statusCode == 201){
          this.mytoastr.showWarning(data.messages,'')
          return
        }
        this.dataFilter = data
        this.data();
        console.log(data);
      },
      error : (err) => {
        console.log(err);
        this.spinner.spinnerOnOff();
      },
      complete : () => {
        this.spinner.spinnerOnOff();
        this.close = true
      }
    })
    // console.log("BUSCANDO....")
  }

  cleanSearch(){
    this.service_name.setValue('')
    this.close = false;
    this.clearData();
    // console.log("BORRANDO....")
  }

  selectOption(event){
    this.optionId=event.value
    // if(this.optionId.id == '1'){
      this.openDialogType(this.optionId.id );
    // }
  }

  editElement() {
    // this.selectedIds
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
  }
  
  handleSelectedIds(selectedIds: any[]) {
    // console.log("Id's: ", selectedIds)
    this.disabledEditOption = selectedIds.length !== 1;
    this.editOption = selectedIds.length == 1;
    console.log("DESAHIBILITR: ",this.disabledEditOption)
    this.selectedIds = selectedIds;
    if(this.selectedIds.length ===1){

      this.getIdService(selectedIds)
    
    }
    console.log("Id--s: ", selectedIds)
  }

  selectedHandle(event){
    console.log("SELECTED: ", event[0])
    if(this.selectedIds.length ===1){
      this.spinner.spinnerOnOff();
      let completedRequests = 0; // Contador para peticiones completadas

      const checkAndStopSpinner = () => {
        completedRequests++;
        if (completedRequests === 2) {
          this.spinner.spinnerOnOff(); // Desactivar spinner cuando ambas peticiones terminen
        }
      };
      this.getIdPerson(event[0].idClient,null,checkAndStopSpinner)
      this.getIdPerson(null,event[0].idProvider,checkAndStopSpinner)
    }
  }


  dataMaster(){
    this.master.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });

    this.master.getItemsMasterTable(1).subscribe({
      next: (data) => {
        this.stateMaster = data;
        console.log("DATAMASTER", data)
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });


  }


  data() {
    this.dataService = this.dataFilter.data.map(item => ({
      ...item,
      serviceTypeName: item.serviceType?.name || ''
    }));
  }

  getIdService(idService){
    this.service.getIdServices(idService).subscribe({
        next:(response)=>{
            this.dataIdService =  response
        },
        error: (error) => {
          console.error('Error:', error);
        }
    })
  }

  clearData() {
    this.pageKey = undefined;
    this.dataService = [];
    this.reload();
  }

  reload() {
    // this.clearData();
    this.dynamic.clearSelection();
    this.dataInitial();
    // this.functionDataCurrent(this.pageSize);
  }

  getIdPerson(idClient?:string,idProvider?:string,callback?: () => void){
    const id = idClient || idProvider
    this.person.postIdPerson(id).subscribe({
      next: (response) => {
        // this.spinner.spinnerOnOff();
        if(idClient) this.idClient = response.data[0];
        if(idProvider) this.idProvider = response.data[0];
        console.log("idClient: ",this.idClient)
        console.log("idProvider: ",this.idProvider)
      },
      error: (error) => {
        console.error(error);
      },
      complete: () =>{
        if (callback) callback(); 
          console.log('complete');
      },
    })
  }


  openDialogType(stateId:string): void {
    
    const dialogRef = this.dialog.open(DialogServiceStatusComponent, {
      width:'900px',
      data: {
      resp: this.dataIdService,
      id: stateId,
      state:this.stateMaster,
      idClient : this.idClient,
      idProvider : this.idProvider
    },
    });

    dialogRef.afterClosed().subscribe(result => {
      this.reload();
      console.log('The dialog was closed',result);
      this.searchData();
    });
  }

  asignationService(){
    this.router.navigate([`/service/edit/${this.selectedIds}`]);
  }


  get service_name(){
    return this.serviceForm.get('service_name')
  }


}
