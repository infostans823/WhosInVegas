import { Component,Input } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the DealsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'deals',
  templateUrl: 'deals.html',
})
export class DealsPage {
  //@Input() public activeComponent: string;

  //private isLoading: boolean = true;

  cardArr: any = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.cardArr = [
      { number: "1", dealheading: "apple", dealdec: "xyz", distanc: "100km", duration: "10 days", dicount: "80%" },
      { number: "2", dealheading: "orange", dealdec: "test2", distanc: "200km", duration: "20 days", dicount: "20%" },
      { number: "3", dealheading: "banana", dealdec: "test3", distanc: "300km", duration: "30 days", dicount: "30%" },
      { number: "4", dealheading: "graps", dealdec: "test4", distanc: "400km", duration: "40 days", dicount: "50%" },
      { number: "5", dealheading: "pinapple", dealdec: "test5", distanc: "500km", duration: "50 days", dicount: "70%" }
      // { number: "6", dealheading: "apple", dealdec: "xyz", distanc: "100km", duration: "10 days", dicount: "80%" },
      // { number: "7", dealheading: "orange", dealdec: "test2", distanc: "200km", duration: "20 days", dicount: "20%" },
      // { number: "8", dealheading: "banana", dealdec: "test3", distanc: "300km", duration: "30 days", dicount: "30%" },
      // { number: "9", dealheading: "graps", dealdec: "test4", distanc: "400km", duration: "40 days", dicount: "50%" },
      // { number: "10", dealheading: "pinapple", dealdec: "test5", distanc: "500km", duration: "50 days", dicount: "70%" }
    ];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DealsPage');
  }

  // onMyFrameLoad(){
  //   this.isLoading = false
  // }

}
