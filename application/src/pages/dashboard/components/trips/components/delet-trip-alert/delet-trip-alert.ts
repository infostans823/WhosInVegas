import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController } from 'ionic-angular';


// services
import { SecureHttpService } from 'services/http';
import { CurrentPage } from '../current/current';

/**
 * Generated class for the DeletTripAlertPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@Component({
  selector: 'page-delet-trip-alert',
  templateUrl: 'delet-trip-alert.html',
})
export class DeletTripAlertPage {
  // [x: string]: any;

  tripId:any;
  private currentTrip: any = [];
  @Input() public activeComponent: string;
  private currentLength: any;
  private currentLocalLimit: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController,
    private http: SecureHttpService,private ref: ChangeDetectorRef,public modal: ModalController) {

    this.tripId = navParams.get('tripId');
    console.log("tripId : "+this.tripId);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DeletTripAlertPage');
  }

  deletTripProcess(){

      this.Deletetrip(this.tripId);
  }
  
  cancle(){
    this.viewCtrl.dismiss();
  }
  ionViewWillLeave(){
    console.log('ionViewWillLeave delet alert');
  }

  async Deletetrip(tripId): Promise<any> {
    // create a new bookmark
    await this.http.post2("/trip/delete", {
      tripId: tripId,
    }).map(res => {
      this.viewCtrl.dismiss(res);
      console.log("res===== :"+res);
        // this.ref.detectChanges();
        // this.navCtrl.push(CurrentPage);
    }).toPromise();
  }
}
