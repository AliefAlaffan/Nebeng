<?php

namespace App\Services\Pricing;
use App\Models\PricingSetting;



class TripPricingService
{
    private function getSetting(
        string $key,
        $default
    )
    {
        return PricingSetting::where(
            'key',
            $key
        )->value('value') ?? $default;
    }

    public function calculate(
        string $vehicleType,
        float $distanceKm,
        ?string $baggageCapacity = null
    ): int {

        // =========================
        // MOTOR (PENUMPANG)
        // =========================

        if ($vehicleType === 'motor') {

            $pricePerKm = $this->getSetting(
                'motor_price_per_km',
                1500
            );

            $minPrice = $this->getSetting(
                'motor_min_price',
                8000
            );

            $price = $distanceKm * $pricePerKm;

            return max(
                $minPrice,
                round($price)
            );
        }

        // =========================
        // MOBIL (PENUMPANG)
        // =========================

        if ($vehicleType === 'mobil') {

            $pricePerKm = $this->getSetting(
                'mobil_price_per_km',
                2500
            );

            $minPrice = $this->getSetting(
                'mobil_min_price',
                15000
            );

            $price = $distanceKm * $pricePerKm;

            return max(
                $minPrice,
                round($price)
            );
        }

        // =========================
        // BARANG
        // =========================

        if (
            str_starts_with($vehicleType, 'Barang-') ||
            str_starts_with($vehicleType, 'barang-')
        ) {

            $basePrice = 0;
            $pricePerKm = 0;

            switch ($vehicleType) {

                case 'barang-motor':
                case 'Barang-Motor':

                    $basePrice =
                        $this->getSetting(
                            'barang_motor_base_price',
                            8000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_motor_price_per_km',
                            800
                        );
                    break;

                case 'barang-mobil':
                case 'Barang-Mobil':

                    $basePrice =
                        $this->getSetting(
                            'barang_mobil_base_price',
                            12000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_mobil_price_per_km',
                            1200
                        );
                    break;

                case 'barang-bus':
                case 'Barang-Bus':

                    $basePrice =
                        $this->getSetting(
                            'barang_bus_base_price',
                            15000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_bus_price_per_km',
                            1400
                        );
                    break;

                case 'barang-kereta':
                case 'Barang-Kereta':

                    $basePrice =
                        $this->getSetting(
                            'barang_kereta_base_price',
                            18000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_kereta_price_per_km',
                            1600
                        );
                    break;

                case 'barang-kapal':
                case 'Barang-Kapal':

                    $basePrice =
                        $this->getSetting(
                            'barang_kapal_base_price',
                            25000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_kapal_price_per_km',
                            2000
                        );
                    break;

                case 'barang-pesawat':
                case 'Barang-Pesawat':

                    $basePrice =
                        $this->getSetting(
                            'barang_pesawat_base_price',
                            35000
                        );

                    $pricePerKm =
                        $this->getSetting(
                            'barang_pesawat_price_per_km',
                            3000
                        );
                    break;

                default:

                    $basePrice = 10000;
                    $pricePerKm = 1000;
            }

            // =========================
            // HITUNG HARGA DASAR
            // =========================

            $price = $basePrice + ($distanceKm * $pricePerKm);

            // =========================
            // MULTIPLIER UKURAN BARANG
            // =========================

            if ($baggageCapacity) {

                $capacity = strtolower($baggageCapacity);

                // XXS (0.5 Kg)
                if (
                    str_contains($capacity, 'xxs')
                ) {

                    $price *= $this->getSetting(
                        'xxs_multiplier',
                        0.6
                    );
                }

                // XS (1 Kg)
                elseif (
                    str_contains($capacity, 'xs')
                ) {

                    $price *= $this->getSetting(
                        'xs_multiplier',
                        0.8
                    );
                }

                // KECIL (5 Kg)
                elseif (
                    str_contains($capacity, 'kecil')
                ) {

                    $price *= $this->getSetting(
                        'kecil_multiplier',
                        1.0
                    );
                }

                // SEDANG (10 Kg)
                elseif (
                    str_contains($capacity, 'medium') ||
                    str_contains($capacity, 'sedang')
                ) {

                    $price *= $this->getSetting(
                        'sedang_multiplier',
                        1.3
                    );
                }

                // BESAR (15 Kg)
                elseif (
                    str_contains($capacity, 'large') ||
                    str_contains($capacity, 'besar')
                ) {

                    $price *= $this->getSetting(
                        'besar_multiplier',
                        1.6
                    );
                }
            }

            return round($price);
        }

        return 0;
    }
}