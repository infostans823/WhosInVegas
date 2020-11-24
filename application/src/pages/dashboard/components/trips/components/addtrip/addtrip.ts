import { Component } from '@angular/core';
import { ModalController, NavController, AlertController, NavParams, ViewController, LoadingController } from 'ionic-angular';

// services
import { DashboardPage } from '../../../../../../pages/dashboard/index';
import { SecureHttpService } from '../../../../../../services/http/index';
import { ApplicationService } from '../../../../../../services/application/index';
import { TripAlertPage } from '../trip-alert/trip-alert'
import { from } from 'rxjs/observable/from';
/**
 * Generated class for the AddtripPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-addtrip',
  templateUrl: 'addtrip.html',
})

export class AddtripPage {
  private Title_Lable: any;
  private startDate: Date = null;
  private endDate: Date = null;

  private startDay: any = "Day"
  private startMonth: any = "Month"
  private startYear: any = "Year"

  // public modalAlrt :any;

  constructor(public navCtrl: NavController,
    private viewCtrl: ViewController,
    public navParams: NavParams,
    private http: SecureHttpService,
    protected loadingCtrl: LoadingController,
    private modal: ModalController,
    private alert2: AlertController) {
    this.Title_Lable = 'Trips';
    // var sDate = navParams.get('startData');
    // var eData = navParams.get('endData');
    // console.log("sData :"+sDate);
    // console.log("eData :"+eData);

  }

  public today() {
    return new Date().toISOString().substring(0, 10);
  }

  public nextDay() {
    var d = new Date(this.startDate);
    //d.setDate(d.getDate() + 1); //Add One Day From Current Date
    d.setDate(d.getDate());
    return d.toISOString().substring(0, 10);
  }

  /**
  * Dismiss
  */
  submit(): void {
    if (this.startDate && this.endDate) {
      let startDate = new Date(this.startDate);
      let endDate = new Date(this.endDate);
      if (endDate >= startDate) {
        this.addtrip();
      } else {
        this.showAlert("Please Enter Valid Dates")
      }
    } else {
      this.showAlert("Please Enter Dates")
    }
  }

  showAlert(titleText){
    const alert = this.alert2.create({
      subTitle: titleText,
      buttons: ['OK']
    });

    alert.present();
  }

  cancel(): void {
    this.viewCtrl.dismiss()
    // this.modal.dismiss();
  }
  ionViewWillLeave() {
    console.log('ionViewWillLeave addtrip');
    this.viewCtrl.dismiss({ data: 'test' })

  }

  async addtrip(): Promise<any> {
    let loader = this.loadingCtrl.create();
    // create a new bookmark
    await loader.present();
    await this.http.post2("/trip/add", {
      first_day_trip: this.startDate,
      last_day_trip: this.endDate
    }).map(res => {
      loader.dismiss();
      // this.viewCtrl.dismiss(res);
      this.alert();
    }).toPromise();
  }

  alert(): void {
    const modalAlrt = this.modal.create(TripAlertPage);
    modalAlrt.present();

    modalAlrt.onDidDismiss(data => {
      console.log("addtrip model close ;" + JSON.stringify(data));

      if (data.flag == false) {
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        console.log("addtrip if call:"+this.viewCtrl.name);
      }else{
        console.log("addtrip else call :"+this.viewCtrl.name);
        this.viewCtrl.dismiss();
      }
    });


  }

  // backAlert(){

  //   this.modalAlrt.onDidDismiss(data => {
  //     console.log("dismiss data : "+data);
  //     });
  // }


}
