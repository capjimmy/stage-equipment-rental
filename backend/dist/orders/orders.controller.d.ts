import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FulfillmentStatus } from '../entities/order.entity';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, createOrderDto: CreateOrderDto): Promise<import("../entities/order.entity").Order>;
    findMyOrders(req: any): Promise<import("../entities/order.entity").Order[]>;
    findOne(req: any, id: string): Promise<import("../entities/order.entity").Order>;
    findAll(status?: FulfillmentStatus): Promise<import("../entities/order.entity").Order[]>;
    cancel(req: any, id: string, reason: string): Promise<import("../entities/order.entity").Order>;
    approve(id: string): Promise<import("../entities/order.entity").Order>;
    confirmPayment(id: string): Promise<import("../entities/order.entity").Order>;
    dispatch(id: string): Promise<import("../entities/order.entity").Order>;
    collect(id: string): Promise<import("../entities/order.entity").Order>;
}
