import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ViewChild, AfterViewInit, Input } from '@angular/core';
import { Scroll, NavController, NavParams, AlertController, ModalController } from 'ionic-angular';

// services
import { SecureHttpService } from '../../../../../../services/http/index';
import { ApplicationService } from '../../../../../../services/application/index';

//pages
//import { TripdetailPage } from '../tripdetail/tripdetail';
import { DeletTripAlertPage } from '../delet-trip-alert/delet-trip-alert';



/**
 * Generated class for the CurrentPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-current',
  templateUrl: 'current.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class CurrentPage implements OnInit {
  private UserID;
  private currentTrip: any = [];
  @Input() public activeComponent: string;
  @ViewChild('currentScroll') scroll: Scroll;
  private searchInProgress: boolean = true;
  private currentLocalLimit: number;
  private clearScrollHandler: any;
  private currentLength: any;
  private apiActive: boolean = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: SecureHttpService,
    private ref: ChangeDetectorRef,
    private alertCtrl: AlertController,
    private config: ApplicationService,
    private modal: ModalController) {
    this.UserID = window.localStorage.getItem('user_id');

    

  }

  parseDate(dt1,dt2) {
    let date1 = new Date(dt1)
    let date2 = new Date(dt2)
    
    return this.datediff(date1,date2)
  }

  datediff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
  }

  async ngOnInit(): Promise<any> {
    console.log("ngOnInit");
    this.getTrips()
    
  }

  // async ionViewWillEnter():Promise<any> {
  //   // this.getTrips()
  //   console.log("ionViewWillEneter");
  // }

  // ionViewDidEnter(){
  //   console.log('ionViewDidEnter Current page');
  // }

  // ionViewWillEnter(){
  //   console.log('ionViewWillEnter Current page');
  // }
  //  onViewWillEnter(){ console.log('onViewWillEnter Current page');}

  private async getTrips(){
    this.searchInProgress = true;
    this.currentLocalLimit = this.defaultLocalLimit;

    await this.http.post2('/trip', {
      limit: this.currentLocalLimit,
      type: this.activeComponent
    }).map(res => {
      this.currentTrip = res.trips
      this.currentLength = this.currentTrip.length
      console.log("this.currentTrip = ",this.currentLength)
    }).toPromise();
    this.searchInProgress = false;
 
    // this.ref.detectChanges()
     this.ref.markForCheck();
  }

  presentAlert() {
    let alert = this.alertCtrl.create({
      title: 'Forbidden',
      subTitle: "You don't have permission to access the page.",
      buttons: ['Ok']
    });
    alert.present();
  }

  /**
     * Get default local limit
     */
  get defaultLocalLimit(): number {
    return 10;//this.api.get('configs', 'hotListLocalLimit').value;
  }

  /**
 * After view init
 */
  ngAfterViewInit() {

  }

  /**
    * Component destroy
    */
  ngOnDestroy(): void {
    if (this.clearScrollHandler) {
      this.clearScrollHandler();
    }
  }

  async presentConfirm(tripId) {
    // let alert = this.alertCtrl.create({
      // title: 'Confirm Delete',
      // message: 'Are you sure you want to delete the trip?',
      // buttons: [
      //   {
      //     text: 'No',
      //     role: 'cancel',
      //     handler: () => {
      //       console.log('Cancel clicked');
      //     }
      //   },
      //   {
      //     text: 'Yes',
      //     handler: () => {
      //       console.log('Buy clicked');
      //       this.Deletetrip(tripId)
      //     }
      //   }
      // ]

    // });
    // alert.present();

    // this.navCtrl.push(DeletTripAlertPage,{tripId});


    const modal = this.modal.create(DeletTripAlertPage,{tripId});
    modal.onDidDismiss(data => {
      console.log("data : "+JSON.stringify(data));
        this.getTrips()
    });

   modal.present();
  }



  async Deletetrip(tripId): Promise<any> {
    // create a new bookmark
    await this.http.post2("/trip/delete", {
      tripId: tripId,
    }).map(res => {
      this.getTrips()
      //this.viewCtrl.dismiss([])
    }).toPromise();
  }
  

  /**
     * Is check load more active
     */
  private get isCheckLoadMoreActive(): boolean {
    if (this.currentLength >= this.currentLocalLimit && this.currentLocalLimit && !this.apiActive) {

      return true;
    }

    return false;
  }
  ionViewWillLeave(){
    console.log('ionViewWillLeave current');
  
  }
  
  // ionViewDidLoad(){ console.log("ionViewDidLoad");}
  // ionViewDidEnter(){ console.log("ionViewDidEnter");}
  // ionViewWillLeave(){ console.log("ionViewWillLeave");}
  // ionViewDidLeave(){ console.log("ionViewDidLeave");}
  // ionViewWillUnload(){ console.log("ionViewWillUnload");}
  // ionViewCanEnter(){ console.log("ionViewCanEnter");}
  // ionViewCanLeave(){ console.log("ionViewCanLeave");}



 
}
