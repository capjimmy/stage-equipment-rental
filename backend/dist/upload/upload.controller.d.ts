export declare class UploadController {
    uploadImage(file: any): {
        error: string;
        url?: undefined;
        filename?: undefined;
        originalname?: undefined;
        size?: undefined;
    } | {
        url: string;
        filename: any;
        originalname: any;
        size: any;
        error?: undefined;
    };
    uploadImages(files: any[]): {
        error: string;
        files?: undefined;
    } | {
        files: {
            url: string;
            filename: any;
            originalname: any;
            size: any;
        }[];
        error?: undefined;
    };
}
