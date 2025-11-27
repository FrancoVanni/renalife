export class CalcCarritoItemDto {
  id: number;
  quantity: number;
  payment_method: 'contado' | 'echeck' | '30_dias';
}

export class CalcCarritoDto {
  products: CalcCarritoItemDto[];
}

