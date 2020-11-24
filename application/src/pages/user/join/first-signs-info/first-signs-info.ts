import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Slides } from 'ionic-angular';
import { DashboardPage } from 'pages/dashboard';

/**
 * Generated class for the FirstSignsInfoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage()
@Component({
  selector: 'page-first-signs-info',
  templateUrl: 'first-signs-info.html',
})
export class FirstSignsInfoPage {


  slideData:any;
  currentIndex=0;

  constructor(public navCtrl: NavController, 
             public navParams: NavParams,
             public viewCtrl: ViewController,
             private nav: NavController,)
     {

    this.slideData = [{ image: "assets/img/custom-images/1.png", },
                       { image: "assets/img/custom-images/2.png", },
                       { image: "assets/img/custom-images/3.png"}] 
                      
                      // this.currentIndex
                      console.log(" this.currentIndex"+ this.currentIndex);
         }

                       

  ionViewDidLoad() {
    console.log('ionViewDidLoad FirstSignsInfoPage');
  }

  dismissInfoSlide(): void{
    console.log("skip click");
    this.viewCtrl.dismiss();
    // this.nav.setRoot(DashboardPage)
  }

   slideChanged(event): void {

     this.currentIndex = event.realIndex;
    console.log('Current index is', event.realIndex);
  }
}