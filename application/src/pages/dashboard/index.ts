import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { Slides, ModalController, NavController, Modal, NavParams, Events } from 'ionic-angular';
import { ISubscription } from 'rxjs/Subscription';

// services
import { ApplicationService } from 'services/application';
import { UserService } from 'services/user'
import { AuthService } from 'services/auth';
import { DashboardService } from 'services/dashboard';
import { SiteConfigsService } from 'services/site-configs';
import { MatchedUsersService, IMatchedUserListItem } from 'services/matched-users';
import { VideoImService } from 'services/video-im';
import { PushNotificationsService } from 'services/push';
import { PersistentStorageService } from 'services/persistent-storage';
import { SecureHttpService } from '../../services/http/index';

// pages
import { MessagesPage } from 'pages/messages';
import { MyService } from 'pages/dashboard/components/tabs/index'
import { ProfileComponent } from 'pages/dashboard/components/profile/index'

// components
import { MatchedUserPageComponent } from './components/matched-user';
import { VideoImConfirmationComponent } from './components/video-im/confirmation';
import { VideoImChatComponent } from './components/video-im/chat';
import { from } from 'rxjs/observable/from';
import { FirstSignsInfoPage } from 'pages/user/join/first-signs-info/first-signs-info';

@Component({
    selector: 'dashboard',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        DashboardService,
        MyService
    ]
})

export class DashboardPage implements OnInit, OnDestroy {
    @ViewChild('componentsSlider') set content(componentsSlider: Slides) {
        this.componentsSlider = componentsSlider;
    }

    @ViewChild(ProfileComponent) child: ProfileComponent;

    isPageLoading: boolean = false;
    callFlg: boolean;
    isShowFirstInfo: boolean;
    subComponent:string=null;

    private isDashboardActive: boolean = true;
    private applicationLocationSubscription: ISubscription;
    private matchedUserSubscription: ISubscription;
    private incomingVideoImCallSubscription: ISubscription;
    private activeCallerIdSubscription: ISubscription;
    private pushNotificationsSubscription: ISubscription;
    private componentsSlider: Slides;
    private matchedUsersModal: Modal;
    private videoImConfirmationModal: Modal;
    private videoImChatModal: Modal;

    private mSelectedTab: string = "profile"

    // push notification constants
    private static PUSH_NOTIFICATION_MESSAGE: string = 'message';
    private static PUSH_NOTIFICATION_MATCHED_USER: string = 'matchedUser';

    /**
     * Constructor
     */
    constructor(
        public siteConfigs: SiteConfigsService,
        public dashboard: DashboardService,
        public myService: MyService,
        public application: ApplicationService,
        private auth: AuthService,
        private ref: ChangeDetectorRef,
        private user: UserService,
        private modal: ModalController,
        private pushNotifications: PushNotificationsService,
        private persistentStorage: PersistentStorageService,
        private matchedUsers: MatchedUsersService,
        private videoIm: VideoImService,
        private nav: NavController,
        private http: SecureHttpService,
        private navParams: NavParams,
        public events: Events) {

            // this.subComponent = this.navParams.get('subComponent');
            // console.log(" subComponent call :"+this.subComponent);

                

            // subComponent

        if (dashboard.getActiveComponent() == 'profile' || dashboard.getActiveComponent() == 'conversations') {
            this.mSelectedTab = dashboard.getActiveComponent()
        } else {
            this.mSelectedTab = dashboard.getActiveSubComponent()
        }

        this.callFlg = this.navParams.get('isInsiCallFlg');
        console.log("callFlg dashboard-----------------" + this.callFlg);

        this.isShowFirstInfo = this.navParams.get('isShowFirst');
        console.log("isShowFirstInfo dashboard-----------------" + this.isShowFirstInfo);


    }

    /**
     * Component init
     */
    // async
     ngOnInit(): Promise<any> {


        if(this.subComponent != null){
            console.log("if subComponent call")
            this.tabChangeComponent('search',this.subComponent);
        }

        //If callFlg is flase it mean user SingUp then show FirstSignsInfoPage
        if (this.isShowFirstInfo == true) {
            const modal = this.modal.create(FirstSignsInfoPage, {});
            modal.present();
        }


        // disallow sliders moving
        this.componentsSlider.followFinger = false;
        this.componentsSlider.noSwiping = true;

        // watch the current user's location
        this.applicationLocationSubscription = this.application.watchLocation().subscribe(location => {
            console.log("location :",location);
            if (location.latitude && location.longitude) {
                window.localStorage.setItem("is_gps_anable", "on")
                this.user.updateLocation(location.latitude, location.longitude).subscribe();
                // this.user.updateLocation("51.507351", "-0.127758").subscribe();
                
                // try {
                //     await this.http.put(this.application.getApiUrl() + '/user-locations/me/', JSON.stringify({
                //         "latitude":this.application.getLocation().latitude, 
                //         "longitude":this.application.getLocation().longitude,
                //         "useGps":true,
                //         "isInVegas":this.arePointsNear(30)
                //     })).toPromise();
                // }
                // catch (e) {
                //     console.log('api call log try ',e);
                // }
            } else {
                window.localStorage.setItem("is_gps_anable", "off")
                // await this.http.put(this.application.getApiUrl() + '/user-locations/me/', JSON.stringify({
                //     "latitude":0, 
                //     "longitude":0,
                //     "useGps":false,
                //     "isInVegas":false
                // })).toPromise();
            }
        });

        this.watchIncomingVideoImCall();
        this.watchActiveInterlocutorData();

        // load user data
        if (!this.user.isUserLoaded(this.user.getUser(this.auth.getUserId()))) {
            this.isPageLoading = true;
            this.ref.markForCheck();

            this.user.loadMe().subscribe(uData => {

                //////Event publish and send data app.component.ts file for show profile
                this.events.publish('user:created', uData, Date.now());

                this.isPageLoading = false;
                this.ref.markForCheck();

                // watch push notifications
                this.pushNotificationsSubscription = this.pushNotifications.watchNotifications().subscribe(data => {
                    this.processPushNotification(data);
                });
            });

            return;
        }

        // watch push notifications
        this.pushNotificationsSubscription = this.pushNotifications.watchNotifications().subscribe(data => {
            this.processPushNotification(data);
        });



    }

    arePointsNear(mile) {
        var ky = 40000 / 360;
        var kx = Math.cos(Math.PI * 36.181271 / 180.0) * ky;
        var dx = Math.abs(-115.134132 - parseInt(this.application.getLocation().longitude)) * kx;
        var dy = Math.abs(36.181271 - parseInt(this.application.getLocation().latitude)) * ky;
        return (Math.sqrt(dx * dx + dy * dy) / 1.6) <= mile;
    }





    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        // if( this.applicationLocationSubscription){
        this.applicationLocationSubscription.unsubscribe();
        // }

        this.stopWatchIncomingVideoImCall();
        this.stopWatchActiveInterlocutorData();

        if (this.pushNotificationsSubscription) {
            this.pushNotificationsSubscription.unsubscribe();
        }
    }

    /**
     * Change component
     */
    changeComponent(component: { componentName: string, subComponentName?: string }): void {
        console.log("Component : ", component)
        this.mSelectedTab = component.subComponentName;
        const componentIndex = this.dashboard.getComponentIndexByName(component.componentName);

        if (componentIndex !== -1) {
            this.dashboard.setActiveComponent(component.componentName, component.subComponentName);
            this.componentsSlider.slideTo(componentIndex);

            this.ref.markForCheck();
        }
    }

    tabChangeComponent(componentName: string, subComponentName?: string): void {
        console.log("componentName : ", componentName+" subComponentName :"+subComponentName);
        

        this.mSelectedTab = subComponentName;
        const componentIndex = this.dashboard.getComponentIndexByName(componentName);

        if (componentIndex !== -1) {
            this.dashboard.setActiveComponent(componentName, subComponentName);
            this.componentsSlider.slideTo(componentIndex);

            this.ref.markForCheck();
        }
    }

    /**
     * Change component
     */
    customChangeComponent(componentName: string): void {
        console.log("Component Custome: ", componentName)
        this.myService.homeTabs()
        this.mSelectedTab = componentName;
        const componentIndex = this.dashboard.getComponentIndexByName(componentName);

        if (componentIndex !== -1) {
            this.dashboard.setActiveComponent(componentName, undefined);
            this.componentsSlider.slideTo(componentIndex);

            this.ref.markForCheck();
        }
        if (this.dashboard.getActiveComponent() == 'profile') {
            this.child.getMyLikesList();
        }
    }

    /**
     * Components slider did change
     */
    componentsSliderDidChange(): void {
        if (this.componentsSlider.getActiveIndex() <= this.dashboard.components.length - 1) {
            this.dashboard.setActiveComponentByIndex(this.componentsSlider.getActiveIndex());
            this.ref.markForCheck();
        }
    }

    /**
     * Page is going to be active
     */
    ionViewWillEnter(): void {
        if (this.dashboard.getActiveComponent() == 'profile') {
            this.child.getMyLikesList();
        }
        this.isDashboardActive = true;
        this.watchNotNotifiedMatchedUser();
        this.ref.markForCheck()
    }

    /**
     * Page is going to be inactive
     */
    ionViewWillLeave(): void {
        this.isDashboardActive = false;
        this.stopWatchingNotNotifiedMatchedUser();
        this.ref.markForCheck()
    }


    /**
     * Stop watching not notified matched user 
     */
    private stopWatchingNotNotifiedMatchedUser(): void {
        if (this.matchedUserSubscription) {
            this.matchedUserSubscription.unsubscribe();
        }

        // close matched users modal window
        if (this.matchedUsersModal) {
            this.matchedUsersModal.dismiss();
        }
    }

    /**
     * Watch for not notified matched user
     */
    private watchNotNotifiedMatchedUser(): void {
        this.matchedUserSubscription = this.matchedUsers.watchNotNotifiedMatchedUser().subscribe(matchedUser => {
            if (matchedUser && !this.matchedUsersModal) {
                this.showMatchedUserModalWindow(matchedUser);
            }
        });
    }

    /**
     * Show matched user modal window
     */
    private showMatchedUserModalWindow(matchedUser: IMatchedUserListItem): void {
        // temporally unsubscribe from matched users source
        this.stopWatchingNotNotifiedMatchedUser();

        this.matchedUsersModal = this.modal.create(MatchedUserPageComponent, {
            matchedUser: matchedUser
        });

        this.matchedUsersModal.onDidDismiss((result: { isShowChat: boolean }) => {
            this.matchedUsersModal = null;

            if (result && result.isShowChat) {
                this.nav.push(MessagesPage, {
                    userId: matchedUser.user.id
                });

                return;
            }

            // subscribe the source again
            if (this.isDashboardActive) {
                this.watchNotNotifiedMatchedUser();
            }
        });

        this.matchedUsersModal.present();
    }


    /**
     * Stop watching first incoming video im notification id
     */
    private stopWatchIncomingVideoImCall(): void {
        if (this.incomingVideoImCallSubscription) {
            this.incomingVideoImCallSubscription.unsubscribe();
        }

        // close video im confirmation modal window
        if (this.videoImConfirmationModal) {
            this.videoImConfirmationModal.dismiss();
        }
    }

    /**
     * Watch first incoming video im notification id
     */
    private watchIncomingVideoImCall(): void {
        this.incomingVideoImCallSubscription = this.videoIm.watchFirstCallingUserId().subscribe(callData => {
            if (callData && !this.videoImConfirmationModal) {
                this.showVideoImConfirmationModalWindow(callData.userId, callData.sessionId);
            }
        });
    }

    /**
     * Show video im confirmation modal window
     */
    private showVideoImConfirmationModalWindow(callerId: number, sessionId: string): void {
        this.videoImConfirmationModal = this.modal.create(VideoImConfirmationComponent, {
            userId: callerId,
            sessionId: sessionId
        });

        this.videoImConfirmationModal.onDidDismiss(() => {
            this.videoImConfirmationModal = null;
        });

        this.videoImConfirmationModal.present();
    }



    /**
     * Stop watching first incoming video im notification id
     */
    private stopWatchActiveInterlocutorData(): void {
        if (this.activeCallerIdSubscription) {
            this.activeCallerIdSubscription.unsubscribe();
        }
    }

    /**
     * Watch first incoming video im notification id
     */
    private watchActiveInterlocutorData(): void {
        this.activeCallerIdSubscription = this.videoIm.watchActiveInterlocutorData().subscribe(activeInterlocutorData => {
            if (activeInterlocutorData.userId) {
                if (this.videoImChatModal) {
                    this.videoImChatModal.dismiss();
                    this.videoImChatModal = null;
                }

                this.videoImChatModal = this.modal.create(VideoImChatComponent, {
                    userId: activeInterlocutorData.userId,
                    isMeInitiator: activeInterlocutorData.isMeInitiator
                });

                this.videoImChatModal.present();
            }
        });
    }

    /**
     * Process notification
     */
    private processPushNotification(notification: any): void {
        if (notification.additionalData &&
            notification.additionalData.uuid != this.persistentStorage.getValue('latest_push_uuid')) {

            // don't process foreground push notices
            if (!notification.additionalData.foreground) {
                this.persistentStorage.setValue('latest_push_uuid', notification.additionalData.uuid);

                switch (notification.additionalData.type) {
                    // redirect to the chat page
                    case DashboardPage.PUSH_NOTIFICATION_MESSAGE:
                        if (notification.additionalData.senderId && notification.additionalData.conversationId) {
                            this.nav.push(MessagesPage, {
                                userId: notification.additionalData.senderId
                            });
                        }

                        break;

                    // redirect to the messages page
                    case DashboardPage.PUSH_NOTIFICATION_MATCHED_USER:
                        this.changeComponent({
                            componentName: 'conversations'
                        });

                        // mark matched user
                        this.matchedUsers.markMatchedUserAsNotified(notification.additionalData.id).subscribe();

                        break;

                    default:
                }
            }
        }
    }
}
