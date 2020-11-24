import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

@Component({
    selector: 'custom-page',
    templateUrl: 'index.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class CustomPageComponent {
    title: string;
    pageName: string;
    params: any = null;

    /**
     * Constructor
     */
    constructor(
        private view: ViewController,
        private navParams: NavParams)
    {
        this.title = this.navParams.get('title');
        this.pageName = this.navParams.get('pageName');
        this.params = this.navParams.get('params');
    }

    /**
     * Close
     */
    close(): void {
        if (this.params && this.params.isRedirectPage === true) {
            window.history.back();
            return;
        }

        this.view.dismiss();
    }
}
