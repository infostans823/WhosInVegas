import { Component,ViewChild, ChangeDetectorRef } from '@angular/core';
import { Platform, App as IonicApp,Nav, ModalController, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';
import { TranslateService } from 'ng2-translate';
import { Observable } from 'rxjs/Observable';
import { Geolocation, GeolocationOptions, Coordinates } from '@ionic-native/geolocation';

// services
import { ApplicationService } from 'services/application';
import { AuthService } from 'services/auth';
import { SiteConfigsService } from 'services/site-configs';
import { BootstrapService } from 'services/bootstrap';
import { SecureHttpService } from 'services/http';
import { PaymentsService } from 'services/payments';
import { AdMobService } from 'services/admob';
import { PermissionsService, IPermission } from 'services/permissions';
import { UserService, IUserWithAvatar, IUserResponse } from 'services/user';

// pages
import { AppUrlPage } from 'pages/app-url';
import { AppMaintenancePage } from 'pages/app-maintenance';
import { LoginPage } from 'pages/user/login';
import { GetStartedPage } from 'pages/user/get-started/get-started';
import { DashboardPage } from 'pages/dashboard';
import { AppSettingsPage } from 'pages/app-settings/settings/index'
import { CustomPageComponent } from 'shared/components/custom-page';
import { ProfileViewPage } from '../pages/profile/index';

import { BaseApp } from './app.base.component';
import { from } from 'rxjs/observable/from';
import { HelpTutorialPage } from 'shared/components/help-tutorial/help-tutorial';

@Component({
    templateUrl: 'app.html',
    providers: [
        StatusBar,
        SplashScreen,
        Geolocation
    ]
})

export class App extends BaseApp {
    @ViewChild(Nav) nav: Nav;
    rootPage: any = DashboardPage;
    my: any = "";
    isPageLoading: boolean = true;
    public avtarData: any=[];
    public imgUrl:any;

    private currentPageName: string;

    /**
     * Constructor
     */
    constructor(
        protected permissions: PermissionsService,
        protected admob: AdMobService,
        protected payments: PaymentsService,
        protected http: SecureHttpService,
        protected ionicApp: IonicApp,
        protected siteConfigs: SiteConfigsService,
        protected bootstrap: BootstrapService,
        protected auth: AuthService,
        protected splashScreen: SplashScreen,
        protected geoLocation: Geolocation,
        protected translate: TranslateService,
        protected application: ApplicationService,
        protected statusBar: StatusBar,
        protected platform: Platform,
        protected keyboard: Keyboard,
        private modal: ModalController,
        private user: UserService,
        private ref: ChangeDetectorRef,
        public events: Events) {
        super(ionicApp, auth, payments);

        events.subscribe('user:created', (uData, time) => {
            // user and time are the same arguments passed in `events.publish(user, time)`
            console.log('Welcome', uData, 'at', time);
            this.my = uData;

        
            // console.log('  this.avtarData.avatar.url :'+this.avtarData.avatar.url);

          });
  

      
        this.initializeApp();
      
    }

    /**
     * Initialize app
     */
    async initializeApp(): Promise<any> {
        await this.platform.ready();
        
        // set default settings for app
        //this.statusBar.styleDefault();

        // set status bar to white
        this.statusBar.backgroundColorByHexString('#000');
        this.keyboard.disableScroll(false);
        this.keyboard.hideKeyboardAccessoryBar(true);

        this.initAppLanguage();
      
        this.watchHttpErrors();
        this.watchMaintenanceMode();
        this.watchAuth();
        this.watchPagesNavigation();
        console.log("is_gps_anable :",window.localStorage.getItem("is_gps_anable"));
        if(window.localStorage.getItem("is_gps_anable") == "on"){
            this.watchLocation();
        }
        this.watchAdmob();

        // application url is not defined yet
        if (!this.application.getApiUrl()) {
            this.splashScreen.hide();

            this.ionicApp.getRootNav().setRoot(AppUrlPage);

            return;
        }
 
        this.loadDependencies();
    }
 
    /**
     * Watch http errors
     */
    protected watchHttpErrors(): void {
        this.http.httpError$.subscribe(error => {
            this.httpErrorHandler(error);
        });
    }
 
    /**
     * Watch maintenance mode
     */
    protected watchMaintenanceMode(): void {
        this.siteConfigs.watchConfig('maintenanceMode').subscribe(config => {
            if (config === true) {
                this.ionicApp.getRootNav().setRoot(AppMaintenancePage);
            }
        });
    }

    /**
     * Watch admob
     */
    protected watchAdmob(): void {
        // watch is admob enabled or not
        this.siteConfigs.watchConfig('isAdmobEnabled').subscribe(() => {
            this.checkAdmobBannerStatus();
        });

        // watch ads permissions
        this.permissions.watchMe('ads_hide_ads').subscribe(() => {
            this.checkAdmobBannerStatus();
        });

        // watch for logout
        this.auth.watchLogout$.subscribe(() => {
            this.checkAdmobBannerStatus();
        });
    }

    /**
     * Watch auth
     */
    protected watchAuth(): void {
        // check logged user's status
        this.ionicApp.getRootNav().viewWillEnter.subscribe(() => {
            if (this.auth.getUserId() && !this.auth.isAuthenticated()) {
                this.auth.logout();
                this.ionicApp.getRootNav().setRoot(LoginPage);
            // }else{
            //     console.log("this.auth.getUserId()===", this.auth.getUserId())
            //     if (this.auth.getUserId()) {
            //         const user = this.http.get('/users/' + this.auth.getUserId(), {
            //             'with[]': [
            //                 'avatar'
            //             ]
            //         });
            //         // normalize user response
            //         user.subscribe(response => {
            //             this.isPageLoading = false;
            //             this.my = response;
            //             this.ref.detectChanges()
            //         }, () => {});
            //     }
            }
        });
    }


    // public isUserShow():void{

    //             console.log("this.auth.getUserId()===", this.auth.getUserId())
                
    //                 if (this.auth.getUserId()) {
    //                     const user = this.http.get('/users/' + this.auth.getUserId(), {
    //                         'with[]': [
    //                             'avatar'
    //                         ]
    //                     });
    //                     // normalize user response
    //                     user.subscribe(response => {
    //                         this.isPageLoading = false;
    //                         this.my = response;
    //                         this.ref.detectChanges()
    //                     }, () => {});
    //           }
    //         }
    /**
     * Watch pages navigation
     */
    protected watchPagesNavigation(): void {
        this.ionicApp.getRootNav().viewDidEnter.subscribe(view => {
            console.log("watchPagesNavigation :",view);
            this.currentPageName = view.pageRef().nativeElement.tagName;
            this.checkAdmobBannerStatus();
        });
    }

    /**
     * Watch location
     */
    protected watchLocation(): void {
        const locationOptions: GeolocationOptions = {
            maximumAge: 1000 * 60 * 5,// cache time is 5 minutes
            enableHighAccuracy: false
        };

        const watch = this.geoLocation.watchPosition(locationOptions);

        watch.subscribe(data => {
            console.log("geoLocation  : ",data);

            const coordinates: Coordinates = data.coords;

            if (coordinates) {
                console.log("Nik : ",coordinates.latitude)
                this.application.setLocation(coordinates.latitude, coordinates.longitude);
            }
        });
    }

    /**
     * Init app language
     */
    protected initAppLanguage(): void {
        // set  the browser lang
        this.application.setLanguage(this.translate.getBrowserLang());
    }
 
    /**
     * Load dependencies
     */
    protected loadDependencies(): void {
        this.bootstrap.loadDependencies().subscribe(() => {
            this.splashScreen.hide();

            // redirect to the maintenance page
            if (this.siteConfigs.getConfig('maintenanceMode') === true) {
                this.ionicApp.getRootNav().setRoot(AppMaintenancePage);

                return;
            }

            this.ionicApp.getRootNav().setRoot(!this.auth.isAuthenticated() ? LoginPage : DashboardPage);
            //this.ionicApp.getRootNav().setRoot(!this.auth.isAuthenticated() ? GetStartedPage : DashboardPage);
        }, (error) => {
            this.splashScreen.hide();

            throw error;
        });
    }

    /**
     * Check admob banner status
     */
    protected checkAdmobBannerStatus(): void {
        if (this.admob.isBannerCreated()) {
            const permission: IPermission = this.permissions.getMe('ads_hide_ads');

            if (this.siteConfigs.getConfig('isAdmobEnabled') && (!permission || !permission.isAllowed)) {
                if (this.siteConfigs.getConfig('admobPages').indexOf(this.currentPageName.toLowerCase()) !== -1) {
                    // show a banner
                    this.admob.showBanner().subscribe();

                    return;
                }
            }
            // hide the banner
            this.admob.hideBanner().subscribe();
        }
    }
    /////////////////// MENU CODE ///////////////////

    setting() {
        this.nav.push(AppSettingsPage);
    }

    logout(): void {
        this.auth.logout();
        this.nav.setRoot(LoginPage);
    }

    showPrivacyPolicyModal(): void {
        const modal = this.modal.create(CustomPageComponent, {
            title: this.translate.instant('privacy_policy_page_header'),
            pageName: 'privacy_policy_page_content'
        });
        modal.present();
    }

    helpTutorial(): void{
        // this.nav.push(ProfileViewPage);
        const modal = this.modal.create(HelpTutorialPage,{userName:this.my.userName});
        modal.present();
        // this.nav.push(HelpTutorialPage,{userName:this.my.userName});
    }

    /**
     * Show terms of use modal
     */
    showTermsOfUseModal(): void {
        const modal = this.modal.create(CustomPageComponent, {
            title: this.translate.instant('tos_page_header'),
            pageName: 'tos_page_content'
        });

        modal.present();
    }

}
