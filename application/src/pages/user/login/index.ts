import { Component, Input, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastController, AlertController, NavController, NavParams, ModalController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { ISubscription } from 'rxjs/Subscription';

// service
import { UserService, IUserData } from 'services/user';
import { ApplicationService } from 'services/application';
import { AuthService } from 'services/auth';
import { SiteConfigsService } from 'services/site-configs';
import { FacebookService } from 'services/facebook';
import { PersistentStorageService } from 'services/persistent-storage';

// questions
import { QuestionBase } from 'services/questions/questions/base';
import { QuestionManager } from 'services/questions/manager';
import { QuestionControlService } from 'services/questions/control.service';

// pages
import { AppUrlPage } from 'pages/app-url';
import { DashboardPage } from 'pages/dashboard';
import { JoinInitialPage } from 'pages/user/join/initial';
import { ForgotPasswordCheckEmailPage } from 'pages/user/forgot-password/check-email';
import { FirstSignsInfoPage } from 'pages/user/join/first-signs-info/first-signs-info';
import { CustomPageComponent } from 'shared/components/custom-page';

@Component({
    selector: 'login',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        QuestionControlService,
        QuestionManager,
        FacebookService
    ]
})

export class LoginPage implements OnInit, OnDestroy {
    @Input() questions: Array<QuestionBase> = []; // list of questions

    isFacebookInProcess: boolean = false;
    form: FormGroup;
    loginInProcessing: boolean = false;  
    forgotPasswordPage = ForgotPasswordCheckEmailPage;
    joinPage = JoinInitialPage;
    appUrlPage = AppUrlPage;
    firstLogin =  FirstSignsInfoPage;

    private siteConfigsSubscription: ISubscription;

    private isLogin : boolean = true;

    /**
     * Constructor
     */
    constructor(
        public questionControl: QuestionControlService,
        public siteConfigs: SiteConfigsService,
        public translate: TranslateService,
        public toast: ToastController,
        private ref: ChangeDetectorRef,
        private user: UserService,
        private auth: AuthService,
        private application: ApplicationService,
        private nav: NavController,
        private alert: AlertController,
        private facebook: FacebookService,
        private persistentStorage: PersistentStorageService,
        private questionManager: QuestionManager,
        private navParams: NavParams,
        private modal: ModalController) {}

    /**
     * Component init
     */
    ngOnInit(): void {
        // watch configs changes
        this.siteConfigsSubscription = this.siteConfigs
            .watchIsPluginActive('fbconnect')
            .subscribe(() => this.ref.markForCheck());

        // Android pwa hack facebook login
        if (this.application.isAppRunningInPwaMode() && this.persistentStorage.getValue('isFacebookPwaLogin')) {
            const urlParams = this.application.getAppUrlParams();

            if (urlParams['access_token']) {
                // trying to get facebook user credentials
                this.facebook.loadFacebookCredentialsByToken(
                    urlParams['access_token']).subscribe(credentials => this.facebookAuth(credentials));
            }
        }

        const isDemoModeActivated: boolean = this.siteConfigs.getConfig('isDemoModeActivated');
 
        // create form items
        this.questions = [
            this.questionManager.getQuestion(QuestionManager.TYPE_TEXT, {
                key: 'login',
                placeholder: this.translate.instant('login_input'),
                value: isDemoModeActivated ? 'demo' : '',
                validators: [
                    {name: 'require'}
                ]
            }, {
                questionClass: 'sk-name',
                hideWarning: true
            }),
            this.questionManager.getQuestion(QuestionManager.TYPE_PASSWORD, {
                key: 'password',
                placeholder: this.translate.instant('password_input'),
                value: isDemoModeActivated ? 'demo' : '',
                validators: [
                    {name: 'require'}
                ]
            }, {
                questionClass: 'sk-password',
                hideWarning: true
            }),
        ];

        // register all questions inside a form group
        this.form = this.questionControl.toFormGroup(this.questions);

        this.form = this.questionControl.toFormGroup(this.questions, formGroup => {
            // validate passwords
            if(!this.isLogin){
                if (formGroup.get('password').value === formGroup.get('repeatPassword').value) {
                    return null;
                }
    
                return {
                    message: this.translate.instant('password_repeat_validator_error'),
                    question: 'repeatPassword'
                };
            }
        });
    }

    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        this.siteConfigsSubscription.unsubscribe();
    }
 
    /**
     * Is facebook connect available
     */
    get isFacebookConnectAvailable(): boolean {
        return this.application.getConfig('facebookAppId') && this.siteConfigs.isPluginActive('fbconnect');
    }

    /**
     * Is generic site url
     */
    get isGenericSiteUrl(): boolean {
        if (this.application.getGenericApiUrl()) {
            return true;
        }

        return false;
    }
 
    /**
     * Login
     */
    login(): void {
        this.loginInProcessing = true;
        this.ref.markForCheck();

        this.user.login(this.form.value.login,
                this.form.value.password).subscribe(data => {

            this.loginInProcessing = false;
            this.ref.markForCheck();

            if (data.success === true) {
                this.auth.setAuthenticated(data.token);
                this.nav.setRoot(DashboardPage,{isInsiCallFlg:true});

                // this.nav.setRoot(FirstSignsInfoPage);

                return;
            }

            this.showAlert(this.translate.instant('login_failed'));
        });
    }

    /**
     * Login
     */
    signup(): void {
        this.ref.markForCheck();
        if(this.form.value.userName == ""){
            this.showAlert("Please enter username!")
        }else if(!this.form.valid){
            this.showAlert("Please enter valid detail")
        }else if(this.form.value.password == ""){
            this.showAlert("Please enter passowrd!")
        }else if(this.form.value.password.length < 4){
            this.showAlert("Password should have more than 4 characters")
        }else{
            if(this.form.value.password == this.form.value.repeatPassword){
                const initialData: IUserData = {
                    ...this.form.value
                }
        
                this.nav.push(JoinInitialPage, {
                    initial: initialData
                });
            }else{
                this.showAlert("Please enter same passwords!")
            }
        }
    }

    /**
     * Facebook login
     */
    facebookLogin(): void {
        // Android pwa hack
        if (this.application.isAppRunningInPwaMode() && !this.application.isAppRunningInMobileSafari()) {
            window.open(this.facebook.getManualLoginUrl(), '_self');

            // Facebook login flag
            this.persistentStorage.setValue('isFacebookPwaLogin', 1);

            return;
        }

        // trying to get facebook user credentials
        this.facebook.loadFacebookCredentials().subscribe(credentials => this.facebookAuth(credentials));
    }

    /**
     * Facebook Auth
     */
    facebookAuth(credentials): void {
        this.isFacebookInProcess = true;
        this.ref.markForCheck();

        //  trying to make the user logged in
        this.facebook.login(credentials).subscribe(response => {
            // the user successfully logged in
            if (response && response.isSuccess) {
                this.auth.setAuthenticated(response.token);
                this.nav.setRoot(DashboardPage);

                return;
            }

            this.showAlert(this.translate.instant('error_occurred'));
            this.isFacebookInProcess = false;
            this.ref.markForCheck();
        });
    }

    /**
     * Show alert
     */
    private showAlert(message: string): void {
        const alert = this.alert.create({
            title: this.translate.instant('error_occurred'),
            subTitle: message,
            buttons: [this.translate.instant('ok')]
        });

        alert.present();
    }
    ////////////////Nikunj Code/////////////////////

    Login(){
        const isDemoModeActivated: boolean = this.siteConfigs.getConfig('isDemoModeActivated');
        this.isLogin = true
         // create form items
         this.questions = []
         this.questions = [
            this.questionManager.getQuestion(QuestionManager.TYPE_TEXT, {
                key: 'login',
                placeholder: this.translate.instant('login_input'),
                value: isDemoModeActivated ? 'demo' : '',
                validators: [
                    {name: 'require'}
                ]
            }, {
                questionClass: 'sk-name',
                hideWarning: true
            }),
            this.questionManager.getQuestion(QuestionManager.TYPE_PASSWORD, {
                key: 'password',
                placeholder: this.translate.instant('password_input'),
                value: isDemoModeActivated ? 'demo' : '',
                validators: [
                    {name: 'require'}
                ]
            }, {
                questionClass: 'sk-password',
                hideWarning: true
            })
        ];

        // register all questions inside a form group
        this.form = this.questionControl.toFormGroup(this.questions);
        this.ref.detectChanges()
    }

    Signup(){
        const isDemoModeActivated: boolean = this.siteConfigs.getConfig('isDemoModeActivated');
        this.isLogin = false
        // create form items
        this.questions = []
        this.questions = [
            this.questionManager.getQuestion(QuestionManager.TYPE_TEXT, {
                key: 'userName',
                    label: this.translate.instant('username_input'),
                    placeholder: this.translate.instant('username_input_placeholder'),
                    validators: [
                        {name: 'require'},
                        {name: 'userName'}
                    ],
                    params: {
                        stacked: true
                    }
            }, {
                questionClass: 'sk-name',
                hideWarning: true
            }),
            this.questionManager.getQuestion(QuestionManager.TYPE_PASSWORD, {
                key: 'password',
                    label: this.translate.instant('password_input'),
                    placeholder: 'Type your password',
                    validators: [
                        {name: 'require'}, {
                            name: 'minLength',
                            message: this.translate.instant('password_min_length_validator_error', {
                                length: this.siteConfigs.getConfig('minPasswordLength')
                            }),
                            params: {
                                length: this.siteConfigs.getConfig('minPasswordLength')
                            }
                        }, {
                            name: 'maxLength',
                            message: this.translate.instant('password_max_length_validator_error', {
                                length: this.siteConfigs.getConfig('maxPasswordLength')
                            }),
                            params: {
                                length: this.siteConfigs.getConfig('maxPasswordLength')
                            }
                        }
                    ],
                    params: {
                        stacked: true
                    }
            }, {
                questionClass: 'sk-password',
                hideWarning: true
            }),
            this.questionManager.getQuestion(QuestionManager.TYPE_PASSWORD, {
                key: 'repeatPassword',
                    label: this.translate.instant('password_repeat_input'),
                    placeholder: this.translate.instant('password_repeat_input_placeholder'),
                    validators: [
                        {name: 'require'}
                    ],
                    params: {
                        stacked: true
                    }
            }, {
                questionClass: 'sk-password',
                hideWarning: true
            }),
        ];

        // register all questions inside a form group
        this.form = this.questionControl.toFormGroup(this.questions);
        this.ref.detectChanges()
    }


    termsAndUse(): void{
        const modal = this.modal.create(CustomPageComponent, {
            title: this.translate.instant('tos_page_header'),
            pageName: 'tos_page_content'
        });

        modal.present();
    }


    privcyPolicy(): void{
        const modal = this.modal.create(CustomPageComponent, {
            title: this.translate.instant('privacy_policy_page_header'),
            pageName: 'privacy_policy_page_content'
        });

        modal.present();
    }


}
