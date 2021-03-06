import { FileService } from './../file/file.service';
import { ModalService, ToastService } from 'ng-zorro-antd-mobile';
import { Router } from '@angular/router';
import { File, Entry } from '@ionic-native/file/ngx';
import { Component, OnInit, Input } from '@angular/core';
import { DeviceService } from '../device/device.service';
import * as moment from 'moment';
import { AccountBook } from '../model/model';
import { SocialSharing } from "@ionic-native/social-sharing/ngx";

@Component({
  selector: 'common-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss'],
})
export class ViewCommonComponent implements OnInit {

  @Input()
  id: string = '';
  datas: Data[] = [];
  constructor(
    private file: File,
    private files: FileService,
    private router: Router,
    private device: DeviceService,
    private modal: ModalService,
    private socialSharing: SocialSharing,
    private toast: ToastService
  ) { }

  ngOnInit() {
    if (!this.device.isMobile()) {
      this.datas = [{ month: '8', lists: [28, 29] }]
      return false;
    }
    this.getMonth().then((months: any[]) => {
      const list = [];
      months.forEach(month => {
        list.push(this.getList(month))
      });
      Promise.all(list).then((res) => {
        months.forEach((month, i) => {
          this.datas.push({
            month: month,
            lists: res[i]
          })
        })
      })
    })
  }

  getMonth() {
    const root = this.file.externalRootDirectory;
    const months = [];
    return new Promise((resolve, reject) => {
      this.file.listDir(`${root}dadNote/`, this.id).then((dir: Entry[]) => {
        dir.forEach((d) => {
          if (d.isDirectory) {
            months.push(d.name);
          }
        })
        resolve(months.sort((a, b) => Number(a) - Number(b)));
      })
    })
  }

  getList(month) {
    const root = this.file.externalRootDirectory;
    const list = [];
    return new Promise((resolve, reject) => {
      this.file.listDir(`${root}dadNote/${this.id}/${month}`, 'datas').then((dir: Entry[]) => {
        dir.forEach((d) => {
          if (d.isFile) {
            const number = Number(d.name.split('.').shift());
            list.push(number);
          }
        })
        resolve(list.sort((a, b) => a - b));
      })
    })
  }

  showAction(month: string, date: string) {
    this.modal.operation([
      { text: '查看账本', onPress: () => this.showDetail(month, date) },
      { text: '导出账本', onPress: () => this.exportFile(month, date)},
      { text: '分享账本', onPress: () => this.preShare(month, date) },
      { text: '取消', onPress: () => { } }
    ]);
  }
  showDetail(month: string, date: string) {
    this.router.navigateByUrl(`/tabs/note?year=${this.id}&month=${month}&date=${date}`);
  }

  /**
   * 导出账本
   * @param month 月
   * @param date 日
   */
  exportFile(month: string,date:string){
    this.toast.loading('正在导出',0);
    // this.files.readFile(`${this.id}-${month}-${date}`).then((account: AccountBook) => {
    //   this.toast.success('导出成功!');
    //   // this.files.exportFileByDate(account);
    // }).catch((err) => {
    //   this.toast.fail("导出失败");
    // })
    this.files.exportFileByDate(`${this.id}-${month}-${date}`).then((res) => {
      this.toast.success('导出成功!');
    }).catch((err) => {
      console.log(err);
      this.toast.fail('导出失败');
    })
  }

  /**
   * 分享账本
   * @param month 月
   * @param date 日
   */
  preShare(month: string, date) {
    const path = this.file.externalRootDirectory + 'dadNote/' + `${this.id}/${month}/exports/`;
    const fileName = moment(`${this.id}-${month}-${date}`).format('YYYY-MM-DD[-过磅单.xlsx]')
    this.file.checkFile(path, fileName).then((flag) => {
      if (flag) {
        this.share(path, fileName);
      }
    }).catch(() => {
      this.toast.info('请先导出账本');
    })

  }

  readFile(path, fileName) {
    return this.file.readAsText(path, fileName);
  }

  share(path, fileName) {
    // this.readFile(path, fileName).then((file) => {
    this.socialSharing.share(null, null, path + fileName, null).then((res) => {
      this.toast.success('分享成功')
    }, (err) => {
      console.log(err);
      this.toast.fail('分享失败');
    })
    // })
  }
}

export interface Data {
  month: string;
  lists: number[];
}
