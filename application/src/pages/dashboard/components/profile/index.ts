import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, Input } from '@angular/core';
import { ModalController, NavController, ToastController, AlertController, NavParams } from 'ionic-angular';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

// services
import { UserService, IUserWithAvatar } from 'services/user';
import { GuestsService, IGuestListItem } from 'services/guests';
import { AuthService } from 'services/auth';
import { SiteConfigsService } from 'services/site-configs';
import { ApplicationService } from 'services/application';
import { PaymentsService } from 'services/payments';
import { Geolocation } from '@ionic-native/geolocation';
import { OpenNativeSettings } from '@ionic-native/open-native-settings';
import { SecureHttpService } from 'services/http';

import { BookmarksService, IBookmarkListItem } from 'services/bookmarks';
import { CompatibleUsersService, ICompatibleUserListItem } from 'services/compatible-users';

// pages
import { EditUserQuestionsPage } from 'pages/user/edit/questions';
import { EditUserPhotosPage } from 'pages/user/edit/photos';
import { AppSettingsPage } from 'pages/app-settings/settings';
import { GuestsPage } from 'pages/user/guests';
import { BookmarksPage } from 'pages/user/bookmarks';
import { LikesPage } from 'pages/user/likes/likes'
import { CompatibleUsersPage } from 'pages/user/compatible-users';
import { InitialPaymentsPage } from 'pages/payments/initial';
import { ProfileViewPage } from 'pages/profile';

import { PersistentStorageService } from 'services/persistent-storage';


// import shared components
import { DownloadPwaComponent } from 'shared/components/download-pwa';
import { FirstSignsInfoPage } from 'pages/user/join/first-signs-info/first-signs-info';

@Component({
    selector: 'profile',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        Geolocation,
        BookmarksService
    ]
})

export class ProfileComponent implements OnInit, OnDestroy {
    @Input() isDashboardLoading: boolean;
    protected token: any = null;
    protected tokenName: string = 'token';

    my$: Observable<IUserWithAvatar>;
    newGuestsCount$: Observable<number>;

    callFlg: boolean;
    isUserLoded: boolean = false;
    public classVariable: string = '';

    profileEditPhotosPage = EditUserPhotosPage;
    profileEditPage = EditUserQuestionsPage;
    appSettingsPage = AppSettingsPage;
    guestsPage = GuestsPage;
    bookmarksPage = BookmarksPage;
    likesPage = LikesPage;
    compatibleUsersPage = CompatibleUsersPage;
    initialPaymentsPage = InitialPaymentsPage;

    itemLocation: any = [{ expanded: false }];
    itemMyLikes: any = [{ expanded: false }];

    itemBookmarks: any = [{ expanded: false }];
    itemMyGuests: any = [{ expanded: false }];
    itemMatches: any = [{ expanded: false }];
    itemSafety: any = [{ expanded: false }];

    cardArr: any = [];

    itemExpandHeight: number = 100;
    itemExpandHeightNew: number = 275;//285;
    itemExpandHeightNoItems: number = 224;
    itemExpandHeightSaafety: number = 240;

    private GPSLabel: string;
    private isAnableGPS: boolean = null;
    private applicationLocationSubscription: ISubscription;


    private siteConfigSubscription: ISubscription;

    //////////////// My Likes /////////////////
    private mMyLikeList: any = [];
    private hasMyLikeList: boolean = false;

    ///////////// Bookmark List ///////////////
    isBookmarksFetched$: Observable<boolean>;
    bookmarkList$: Observable<Array<IBookmarkListItem>>;
    private isBookmarksFetchedSubscription: ISubscription;
    private hasBookmarkList: boolean = false;
    private mBookmarkList: any = [];

    ///////////// My Matches List ///////////////
    isMatchesUsersFetched$: Observable<boolean>;
    myMatchesList$: Observable<Array<ICompatibleUserListItem>>;
    private hasMyMatchList: boolean = false;
    private mMyMatchList: any = [];

    ///////////// My Guests List ///////////////
    isGuestsFetched$: Observable<boolean>;
    guestList$: Observable<Array<IGuestListItem>>;
    private hasMyGuestList: boolean = false;
    private mMyGuestList: any = [];


    /**
     * Constructor
     */
    constructor(
        public payments: PaymentsService,
        public siteConfigs: SiteConfigsService,
        private guests: GuestsService,
        private ref: ChangeDetectorRef,
        private auth: AuthService,
        private user: UserService,
        private modal: ModalController,
        private application: ApplicationService,
        private nav: NavController,
        protected toast: ToastController,
        private geolocation: Geolocation,
        protected alert: AlertController,
        private openNativeSettings: OpenNativeSettings,
        private bookmarks: BookmarksService,
        private compatibleUsers: CompatibleUsersService,
        private http: SecureHttpService,
        private navParams: NavParams,
        private storage: PersistentStorageService) {

        // this.nav.get("profMethodFlg");
        this.callFlg = this.navParams.get('isInsiCallFlg')
        console.log("callFlg-----------------" + this.callFlg);

        // this.cardArr = [
        //     { number: "1", dealheading: "apple", dealdec: "xyz", distanc: "100 meters", duration: "10 days", dicount: "80%" },
        //     { number: "2", dealheading: "orange", dealdec: "test2", distanc: "200 meters", duration: "20 days", dicount: "20%" },
        //     { number: "3", dealheading: "banana", dealdec: "test3", distanc: "300 meters", duration: "30 days", dicount: "30%" },
        //     { number: "4", dealheading: "graps", dealdec: "test4", distanc: "400 meters", duration: "40 days", dicount: "50%" },
        //     { number: "5", dealheading: "pinapple", dealdec: "test5", distanc: "500 meters", duration: "50 days", dicount: "70%" }
        // { number: "6", dealheading: "apple", dealdec: "xyz", distanc: "100km", duration: "10 days", dicount: "80%" },
        // { number: "7", dealheading: "orange", dealdec: "test2", distanc: "200km", duration: "20 days", dicount: "20%" },
        // { number: "8", dealheading: "banana", dealdec: "test3", distanc: "300km", duration: "30 days", dicount: "30%" },
        // { number: "9", dealheading: "graps", dealdec: "test4", distanc: "400km", duration: "40 days", dicount: "50%" },
        // { number: "10", dealheading: "pinapple", dealdec: "test5", distanc: "500km", duration: "50 days", dicount: "70%" }
        //   ];


    }

    /**
     * Component init
     */
    ngOnInit(): void {
        this.token = this.storage.getValue(this.tokenName);

        // watch configs changes
        this.siteConfigSubscription = this.siteConfigs
            .watchConfig('activePlugins')
            .subscribe(() => this.ref.markForCheck());

        console.log("this.application.getLocation() = ", this.application.getLocation())

        if (!this.application.getLocation().latitude && !this.application.getLocation().latitude) {
            window.localStorage.setItem("is_gps_anable", "off")
            this.GPSLabel = "Use GPS"
            this.isAnableGPS = false;
        } else {
            window.localStorage.setItem("is_gps_anable", "on")
            this.GPSLabel = "Already using GPS"
            this.isAnableGPS = true;
        }
        this.ref.markForCheck()


        this.user.loadMe().subscribe((data) => {
            console.log("loadMe()===", data)
            this.isUserLoded = true

            // init watchers
            this.my$ = this.user.watchMe();
            console.log("this.my$ = ", this.my$)
            // this.newGuestsCount$ = this.guests.watchNewGuestCount();


            this.isGuestsFetched$ = this.guests.watchIsGuestsFetched();
            this.guestList$ = this.guests.watchGuestList();


            // if(this.callFlg==true){


            //////////////////////// My Likes List /////////////////////
            this.getMyLikesList();
           

            /////////////////////////Bookmark/////////////////////////////
            this.getBookmark()

            ///////////////////// My Matches List //////////////////////

            this.isMatchesUsersFetched$ = this.compatibleUsers.watchIsCompatibleUsersFetched();
            this.myMatchesList$ = this.compatibleUsers.watchCompatibleUserList();

            this.myMatchesList$.subscribe(data => {
                console.log("Matches Nikunj : ", data)
                if (data) {
                    if (data.length == 0) {
                        this.hasMyMatchList = false;
                    } else {
                        this.mMyMatchList = data;
                        this.hasMyMatchList = true;
                    }
                } else {
                    this.hasMyMatchList = false;
                }
                this.ref.markForCheck()
            })


            //////////////////////// My Guests List /////////////////////

            // this.isGuestsFetched$ = this.guests.watchIsGuestsFetched();
            // this.guestList$ = this.guests.watchGuestList();

            this.guestList$.subscribe(data => {
                console.log("Guest Nikunj : ", data)
                if (data) {
                    if (data.length == 0) {
                        this.hasMyGuestList = false;
                    } else {
                        this.mMyGuestList = data;
                        this.hasMyGuestList = true;
                    }
                } else {
                    this.hasMyGuestList = false;
                }
                this.ref.markForCheck()
            })
            // }
        });
    }

    ionViewWillEnter() {
        this.callFlg == true;
        console.log("ionViewWillEnetr : " + this.callFlg);
    }




    public getMyLikesList() {

        if (this.isUserLoded) {

            console.log("HHH")
            const bookmarkList = this.http.get('math-actions/mutual-likes');
            // normalize response
            bookmarkList.subscribe(response => {
                console.log("Likes Nikunj : ", response)
                if (response.status) {
                    if (response.users.length == 0) {
                        this.hasMyLikeList = false
                    } else {
                        this.mMyLikeList = response.users
                        this.hasMyLikeList = true;
                        console.log("mMyLikeList : ", this.mMyLikeList)
                        
                    }
                } else {
                    this.hasMyLikeList = false
                }
                this.ref.markForCheck()
            }, () => {
                this.hasMyLikeList = false
                this.ref.markForCheck()
            });
        }
    }


    public getBookmark(){
        if (this.isUserLoded) {
            ////////////////////// Bookmark List ///////////////////////
            this.isBookmarksFetched$ = this.bookmarks.watchIsBookmarksFetched();
          
           
                this.bookmarkList$ = this.bookmarks.watchBookmarkList();
                this.bookmarkList$.subscribe(data => {
                    console.log("Bookmarks Nikunj : ", data)
                    if (data) {
                        if (data.length == 0) {
                            this.hasBookmarkList = false;
                        } else {
                            this.mBookmarkList = data;
                            this.hasBookmarkList = true;
                        }
                    } else {
                        this.hasBookmarkList = false;
                    }
                    this.ref.markForCheck()
                })

            // check if we need to load the bookmark list
            this.isBookmarksFetchedSubscription = this.isBookmarksFetched$.subscribe(isBookmarksFetched => {
                if (!isBookmarksFetched) {
                    this.bookmarks.loadBookmarkList();
                }
            });
            }


    }

    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        if (this.isUserLoded) {
            this.siteConfigSubscription.unsubscribe();
            this.applicationLocationSubscription.unsubscribe();
            // if (this.token) {
            this.isBookmarksFetchedSubscription.unsubscribe();
            console.log("isBookmarksFetchedSubscription Destroy call");
            // }
        }

    }

    /**
     * Is installation guide allowed
     */
    get isInstallationGuideAllowed(): boolean {
        return this.application.isAppReadyForDownload() && this.siteConfigs.getConfig('isDemoModeActivated');
    }

    /**
     * Show profile
     */
    showProfile(): void {
        this.nav.push(ProfileViewPage, {
            userId: this.auth.getUserId()
        });
    }

    viewProfile(userId): void {
        this.nav.push(ProfileViewPage, {
            userId: userId
        });
    }

    /**
     * Show installation guide
     */
    showInstallationGuide(): void {
        const modal = this.modal.create(DownloadPwaComponent);

        modal.present();
    }

    expandItem(item, itemArray) {
        console.log("expandItem.item=" + item);
        console.log("expandItem.itemArray=" + itemArray);


        if (item.expanded) {
            item.expanded = false;
        } else {
            itemArray.map(listItem => {
                console.log("stringify.item=" + JSON.stringify(listItem));

                if (item == listItem) {
                    listItem.expanded = !listItem.expanded;
                } else {
                    listItem.expanded = false;
                }
                return listItem;
            });
        }
    }

    protected showNotification(lang: string): void {
        const notificationToaster = this.toast.create({
            message: lang,
            closeButtonText: 'Ok',
            showCloseButton: true,
            duration: this.siteConfigs.getConfig('toastDuration')
        });

        notificationToaster.present();
    }



    ///////////Enable-Desable GPS code////////////////


    enablePermission() {
        this.geolocation.getCurrentPosition().then((position) => {
            if (position && position.coords !== undefined) {
                let appLocation: { latitude: string, longitude: string } = this.application.getLocation();

                if (!appLocation
                    || appLocation.latitude != position.coords.latitude.toString()
                    || appLocation.longitude != position.coords.longitude.toString()) {

                    this.application.setLocation(position.coords.latitude, position.coords.longitude);

                    this.GPSLabel = "Already using GPS"
                    this.isAnableGPS = true;
                    this.classVariable = 'en';
                    this.ref.detectChanges()

                    if (this.arePointsNear(30, position.coords.latitude, position.coords.longitude)) {
                        this.popupInVegas()
                    } else {
                        this.popupNotInVegas()
                    }
                }
            } else {
                this.GPSLabel = "Use GPS"
                this.isAnableGPS = false;
                this.ref.detectChanges()
            }
        }).catch((error) => {
            console.log('Error getting location', error);
        });

    }

    arePointsNear(mile, latitude, longitude) {
        var ky = 40000 / 360;
        var kx = Math.cos(Math.PI * 36.181271 / 180.0) * ky;
        var dx = Math.abs(-115.134132 - longitude) * kx;
        var dy = Math.abs(36.181271 - latitude) * ky;
        return (Math.sqrt(dx * dx + dy * dy) / 1.6) <= mile;
    }

    popupInVegas() {
        let Buttons: any[] = [];
        Buttons = [{
            text: "Ok"
        }];

        let confirm = this.alert.create({
            title: "GPS",
            message: "You are verified. Welcome to Vegas!",
            buttons: Buttons
        });

        this.user.getMe().user.isInVegas = true
        this.ref.detectChanges();

        confirm.present();
    }

    popupNotInVegas() {
        let Buttons: any[] = [];
        Buttons = [{
            text: "Ok"
        }];

        let confirm = this.alert.create({
            title: "GPS",
            message: "You could not be verified. Please ensure you are within a 30 mile radius of Las Vegas, NV.",
            buttons: Buttons
        });

        this.user.getMe().user.isInVegas = false
        this.ref.detectChanges();

        confirm.present();
    }

    popupDisableGps() {
        let Buttons: any[] = [];
        Buttons = [{
            text: "Cancel"
        }, {
            text: "Ok",
            handler: () => {
                this.openSettingForGPS()
            }
        }];

        let confirm = this.alert.create({
            title: "GPS",
            message: "Your GPS has been disabled on our application",
            buttons: Buttons
        });

        confirm.present();
    }

    openSettingForGPS() {
        window.localStorage.setItem("is_gps_anable", "off")
        this.GPSLabel = "Use GPS"
        this.isAnableGPS = false;
        this.classVariable = 'dis';
        this.ref.detectChanges()

        //this.openNativeSettings.open("application_details")
    }

}
