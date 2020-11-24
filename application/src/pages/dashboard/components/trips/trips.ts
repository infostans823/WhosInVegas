import { Component, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController } from 'ionic-angular';
import { AddtripPage } from 'pages/dashboard/components/trips/components/addtrip/addtrip';
import { TripAlertPage } from './components/trip-alert/trip-alert';

/**
 * Generated class for the TripsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'trips',
  templateUrl: 'trips.html',
})
export class TripsPage {

  private isUpcommingSelect: boolean = true;
  private mSelectedTab: string = "current"

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    private ref: ChangeDetectorRef,
    private modal: ModalController,
    private view: ViewController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TripsPage');
  }

  ionViewDidEnter(){
    console.log('ionViewDidEnter TripsPage');
  }

  ionViewWillEnter(){
    console.log('ionViewWillEnter TripsPage');
  }

  onViewWillEnter(){ console.log('onViewWillEnter TripsPage');}
  

  private selectedTabe(tabSelected){
    this.mSelectedTab = tabSelected
    this.ref.detectChanges()
  }

  showAddTripModal(): void {
    this.navCtrl.push(AddtripPage);
    
  //   const modal = this.modal.create(AddtripPage);
  //   modal.onDidDismiss(data => {
  //    console.log("TripsPage modelClose");
  // });
  //  modal.present();
  }

  ionViewWillLeave(){
    console.log('ionViewWillLeave trips');
  
  }
  // ionViewWillLeave(){
  //   console.log('ionViewWillLeave TripsPage');
  //   this.view.dismiss();
  // }
  // showAddTripModal2(): void {
  //   // this.navCtrl.push(TripAlertPage);
  //   const modal = this.modal.create(TripAlertPage);
  //   modal.present();
  // }
  

}
