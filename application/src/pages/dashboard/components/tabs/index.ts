
import { Component, ChangeDetectionStrategy, Input, Output, ChangeDetectorRef, EventEmitter, OnInit, OnDestroy, Injectable } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

// services
import { DashboardService } from 'services/dashboard';
import { SiteConfigsService } from 'services/site-configs';
import { MatchedUsersService } from 'services/matched-users';
import { MessagesService } from 'services/messages';

@Component({
    selector: 'dashboard-tabs',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

@Injectable()
export class DashboardTabsComponent implements OnInit, OnDestroy {
    @Input() activeComponent: string;
    @Input() activeSubComponent: string;
    @Output() componentChanged = new EventEmitter();

    private mSelectedTab : string = "";

    newMatchedUsersCount$: Observable<number>;
    newConversationsCount$: Observable<number>;

    private siteConfigsSubscription: ISubscription;

    /**
     * Constructor
     */
    constructor(
        public siteConfigs: SiteConfigsService,
        public dashboard: DashboardService,
        private messages: MessagesService,
        private matchedUsers: MatchedUsersService,
        private ref: ChangeDetectorRef) {
            console.log("activeComponent = ",this.activeComponent)
        }

    /**
     * Component init
     */
    ngOnInit(): void {
        // watch configs changes
        // this.siteConfigsSubscription = this.siteConfigs.watchConfigGroup([
        //     'searchMode',
        //     'activePlugins'
        // ]).subscribe(() => {
        //     // check sub components state
        //     switch (this.activeSubComponent) {
        //         case this.dashboard.hotListPage :
        //             // the hot list plugin is deactivated
        //             if (!this.siteConfigs.isPluginActive('hotlist')) {
        //                 // redirect to an appropriate page
        //                 this.siteConfigs.isTinderSearchAllowed()
        //                     ? this.changeComponent(this.activeComponent, this.dashboard.tinderPage)
        //                     : this.changeComponent(this.activeComponent, this.dashboard.browsePage)
        //             }

        //             break;

        //         // tinder search is activated 
        //         case this.dashboard.browsePage :
        //             if (this.siteConfigs.isTinderSearchMode()) {
        //                 this.changeComponent(this.activeComponent, this.dashboard.tinderPage);
        //             }

        //             break;

        //         // browse search is activated 
        //         case this.dashboard.tinderPage :
        //             if (this.siteConfigs.isBrowseSearchMode()) {
        //                 this.changeComponent(this.activeComponent, this.dashboard.browsePage);
        //             }

        //             break;

        //         default :
        //     }

        //     this.ref.markForCheck();
        // });

        // if(this.activeComponent == 'profile' || this.activeComponent == 'conversations'){
        //     this.mSelectedTab = this.activeComponent
        // }else{
        //     this.mSelectedTab = this.activeSubComponent
        // }
        
        // // init watchers
        // this.newMatchedUsersCount$ = this.matchedUsers.watchNewMatchedUsersCount();
        // this.newConversationsCount$ = this.messages.watchNewConversationsCount();
    }

    /**
     * Component destroy
     */
    ngOnDestroy(): void {
        //this.siteConfigsSubscription.unsubscribe();
    }

    /**
     * Change component
     */
    changeComponent(componentName: string, subComponentName?: string): void {
        this.componentChanged.emit({
            componentName: componentName,
            subComponentName: subComponentName
        });
    }

    search(){
        console.log("Tabs : search")
        this.mSelectedTab = "search"
        this.changeComponent(this.dashboard.searchPage, this.dashboard.browsePage)
    }

    matches(){
        console.log("Tabs : matches")
        this.mSelectedTab = "matches"
        this.changeComponent(this.dashboard.searchPage, this.dashboard.tinderPage)
    }

    trips(){
        this.mSelectedTab = "trips"
        console.log("Tabs : ",this.mSelectedTab)
    }

    deals(){
        console.log("Tabs : deals")
        this.mSelectedTab = "deals"
    }

}

@Injectable()
export class MyService extends DashboardTabsComponent  {
    public homeTabs() {
        super.trips();
    }
}
