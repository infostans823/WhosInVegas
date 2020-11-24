import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// services
import { SecureHttpService } from 'services/http';

// pages
import { ProfileViewPage } from 'pages/profile';

// component
import { MatchActionsComponent } from 'shared/components/match-actions';


@Component({
  selector: 'page-likes',
  templateUrl: 'likes.html',
})

export class LikesPage {
  @ViewChild('matchActions') matchActionsComponent: MatchActionsComponent;

  private mMyLikeList: any = [];
  private hasMyLikeList: boolean = false;

  private isPageLoading: boolean = true;

  constructor(
    public navParams: NavParams,
    private http: SecureHttpService,
    private ref: ChangeDetectorRef,
    private nav: NavController) {

  }

  viewProfile(userId): void {
    this.nav.push(ProfileViewPage, {
        userId: userId
    });
  }

  ionViewWillEnter(): void {
    this.getMyLikesList();
  }

  getMyLikesList(){

    const bookmarkList = this.http.get('math-actions/mutual-likes');
    // normalize response
    bookmarkList.subscribe(response => {
      console.log("Likes : ",response)
      if(response.status){
        if(response.users.length == 0){
          this.hasMyLikeList = false
        }else{
          this.mMyLikeList = response.users
          this.hasMyLikeList = true;
          console.log("mMyLikeList : ",this.mMyLikeList)
        }
      }else{
        this.hasMyLikeList = false
      }
      this.isPageLoading = false;
      this.ref.detectChanges();
    }, () => {
      this.hasMyLikeList = false
      this.isPageLoading = false;
      this.ref.detectChanges();
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LikesPage');
  }

  dislike(userId) {
    const match = this.http.delete('/math-actions/user/'+userId);

    match.subscribe(response => {
      console.log("Dislike : ",response)
      this.getMyLikesList()
    }, () => {
    });
  }

}
