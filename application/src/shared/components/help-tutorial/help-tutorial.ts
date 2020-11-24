import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController } from 'ionic-angular';
// import { TipInfoPage } from './components/tip-info/tip-info';
import { Profile } from 'selenium-webdriver/firefox';
import { ProfileComponent } from 'pages/dashboard/components/profile';
import { SearchComponent } from 'pages/dashboard/components/search';
import { DashboardPage } from 'pages/dashboard';

/**
 * Generated class for the HelpTutorialPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage()
@Component({
  selector: 'page-help-tutorial',
  templateUrl: 'help-tutorial.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpTutorialPage {

  userName:any;
  isInfoTipScr1:boolean=false;
  isPopupForShowInfo:boolean=true;
  isInfoTipScr2:boolean=false;

  isInfoTipScr3:boolean=false;

  constructor(public navCtrl: NavController, 
              public navParams: NavParams,
              public viewCtrl: ViewController,
              private modal: ModalController) {
                
    this.userName =  navParams.get('userName');
    console.log("userName : "+this.userName + "  isInfoTip : "+this.isInfoTipScr1+" isPopupForShowInfo : "+ this.isPopupForShowInfo);

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HelpTutorialPage');
  }

  cancle(){
    this.viewCtrl.dismiss();
  }

  showInfoTip(){
    // this.navCtrl.push(ProfileComponent);
    // const modal = this.modal.create(TipInfoPage);
    //  modal.present();
    this.isPopupForShowInfo=false;
    this.isInfoTipScr1=true;
    this.isInfoTipScr2=false;
    this.isInfoTipScr3=false;

  }

  infoClick(){
    this.isPopupForShowInfo=false;
    this.isInfoTipScr1=false;
    this.isInfoTipScr2=true;
    this.isInfoTipScr3=false;
    

  }

  testScr3(){

    this.isPopupForShowInfo=false;
    this.isInfoTipScr1=false;
    this.isInfoTipScr2=false;
    this.isInfoTipScr3=true;
    // this.navCtrl.push(SearchComponent,{subComponent:'search'});
    // this.navCtrl.setRoot(DashboardPage,{subComponent:'search'});
    

  }

}
