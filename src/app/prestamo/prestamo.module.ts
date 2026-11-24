import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular/lazy';
import { PrestamoPageRoutingModule } from './prestamo-routing.module';
import { PrestamoPage } from './prestamo.page';

@NgModule({
  imports: [CommonModule, IonicModule, PrestamoPageRoutingModule],
  declarations: [PrestamoPage],
})
export class PrestamoPageModule {}
