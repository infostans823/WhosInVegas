import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ModalController } from 'ionic-angular';
import { AddtripPage } from '../addtrip/addtrip';

/**
 * Generated class for the TripAlertPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-trip-alert',
  templateUrl: 'trip-alert.html',
})
export class TripAlertPage {

  modalAlrt:any;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private view: ViewController,
    private modal: ModalController) {

      // this.view.dismiss();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TripAlertPage');
  }

  ionViewWillLeave(){
    console.log('ionViewWillLeave TripAlertPage : '+this.view.name);
    // if(this.view !=null){
    //  this.view.dismiss();
    // }
  }

  returnBack(): void {
    // let data = { flag:true};
    // console.log("flag :"+data);
    this.view.dismiss({flag:true})
    // this.navCtrl.popTo('CurrentPage');
    // this.navCtrl.pop();
  }

  addAnotherTrip(): void {
    // this.navCtrl.pop();
    // this.navCtrl.push(AddtripPage);
  // this.modalAlrt = this.modal.create(AddtripPage);
  //   modalAlrt.onDidDismiss(data => {
  //       console.log("trip-alert model close :"+data);
  //  });
  //  this. modalAlrt.present();
  this.view.dismiss({flag:false,startDate:null,endDate:null});
  
  }

}
