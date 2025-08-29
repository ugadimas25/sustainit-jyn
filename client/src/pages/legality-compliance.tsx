import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye, ChevronDown } from 'lucide-react';
import type { UploadResult } from '@uppy/core';


export default function LegalityCompliance() {
  const [activeTab, setActiveTab] = useState('supplier-compliance');
  const { toast } = useToast();

  // Fetch data from Data Collection forms for suggestions
  const { data: estateData = [] } = useQuery({
    queryKey: ['/api', 'estate-data-collection'],
  });

  const { data: millData = [] } = useQuery({
    queryKey: ['/api', 'mill-data-collection'],
  });

  const { data: traceabilityData = [] } = useQuery({
    queryKey: ['/api', 'traceability-data-collection'],
  });

  const { data: kcpData = [] } = useQuery({
    queryKey: ['/api', 'kcp-data-collection'],
  });

  const { data: bulkingData = [] } = useQuery({
    queryKey: ['/api', 'bulking-data-collection'],
  });

  // Helper functions to extract suggestions from data collection forms
  const getSupplierSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    // Get supplier names from estate data
    if (Array.isArray(estateData)) {
      estateData.forEach((estate: any) => {
        if (estate?.supplierName) suggestions.push(estate.supplierName);
        if (estate?.groupName) suggestions.push(estate.groupName);
        if (estate?.companyName) suggestions.push(estate.companyName);
      });
    }
    
    // Get supplier names from mill data
    if (Array.isArray(millData)) {
      millData.forEach((mill: any) => {
        if (mill?.supplierName) suggestions.push(mill.supplierName);
        if (mill?.companyName) suggestions.push(mill.companyName);
      });
    }
    
    // Get supplier names from traceability data
    if (Array.isArray(traceabilityData)) {
      traceabilityData.forEach((traceability: any) => {
        if (traceability?.supplierName) suggestions.push(traceability.supplierName);
        if (traceability?.companyName) suggestions.push(traceability.companyName);
      });
    }
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getAddressSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    // Get addresses from all forms
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.officeAddress) suggestions.push(item.officeAddress);
      if (item?.facilityAddress) suggestions.push(item.facilityAddress);
      if (item?.address) suggestions.push(item.address);
      if (item?.estateAddress) suggestions.push(item.estateAddress);
      if (item?.location) suggestions.push(item.location);
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getCoordinateSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.coordinates) suggestions.push(item.coordinates);
      if (item?.gpsCoordinates) suggestions.push(item.gpsCoordinates);
      if (item?.latitude && item?.longitude) {
        suggestions.push(`${item.latitude}, ${item.longitude}`);
      }
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  const getContactPersonSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    const allData = [
      ...(Array.isArray(estateData) ? estateData : []),
      ...(Array.isArray(millData) ? millData : []),
      ...(Array.isArray(traceabilityData) ? traceabilityData : []),
      ...(Array.isArray(kcpData) ? kcpData : []),
      ...(Array.isArray(bulkingData) ? bulkingData : [])
    ];
    
    allData.forEach((item: any) => {
      if (item?.contactPersonName) suggestions.push(item.contactPersonName);
      if (item?.responsiblePerson) suggestions.push(item.responsiblePerson);
      if (item?.managerName) suggestions.push(item.managerName);
      if (item?.personInCharge) suggestions.push(item.personInCharge);
    });
    
    return Array.from(new Set(suggestions.filter(Boolean)));
  };

  // AutocompleteInput component
  const AutocompleteInput = ({ 
    value, 
    onChange, 
    suggestions, 
    placeholder, 
    className,
    ...props 
  }: {
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    className?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (value) {
        const filtered = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions(suggestions);
      }
    }, [value, suggestions]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className={className}
            {...props}
          />
          {suggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:bg-transparent"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          )}
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => {
                  onChange(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        {showSuggestions && filteredSuggestions.length === 0 && value && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
          >
            <div className="px-3 py-2 text-sm text-gray-500">
              Tidak ada saran yang ditemukan
            </div>
          </div>
        )}
      </div>
    );
  };

  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    // Basic Information
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '',
    aktaPerubahan: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    alamatKantor: '',
    alamatKebun: '',
    koordinatKebun: '',
    koordinatKantor: '',
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // 3.1 Hak Penggunaan Tanah
    historisPerolehanTanah: '',
    historisKeterangan: '',
    izinPencadanganLahan: '',
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: '',
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: '',
    izinUsahaPerkebunanKeterangan: '',
    skHGU: '',
    skHGUKeterangan: '',
    sertifikatHGU: '',
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: '',
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: '',
    laporanLPUPKeterangan: '',
    
    // 3.2 Perlindungan Lingkungan Hidup
    izinLingkungan: '',
    izinLingkunganKeterangan: '',
    izinRintekTPS: '',
    izinRintekTPSKeterangan: '',
    izinPertekLimbah: '',
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: '',
    persetujuanAndalalinKeterangan: '',
    daftarPestisida: '',
    daftarPestisidaKeterangan: '',
    
    // 3.3 Bukti Pelaksanaan
    buktiPelaksanaan: '',
    buktiPelaksanaanKeterangan: '',
    laporanRKLRPL: '',
    laporanRKLRPLKeterangan: '',
    laporanPestisida: '',
    laporanPestisidaKeterangan: '',
    
    // 3.4 Peraturan Kehutanan
    areaSesuaiPeruntukan: '',
    areaSesuaiPeruntukanKeterangan: '',
    skPelepasanHutan: '',
    skPelepasanHutanKeterangan: '',
    dokumenInstansiRelevant: '',
    dokumenInstansiRelevanKeterangan: '',
    
    // 3.5 Hak Pihak Ketiga dan Masyarakat Adat
    kebijakanHakPihakKetiga: '',
    kebijakanHakPihakKetigaKeterangan: '',
    kebijakanPerusahaan: '',
    kebijakanPerusahaanKeterangan: '',
    sopGRTT: '',
    sopGRTTKeterangan: '',
    sopPADIATAPA: '',
    sopPADIATAPAKeterangan: '',
    sopPermintaanInformasi: '',
    sopPermintaanInformasiKeterangan: '',
    sopKeluhanStakeholder: '',
    sopKeluhanStakeholderKeterangan: '',
    
    // 3.6 Kewajiban Pengembangan Plasma
    mouKerjaSama: '',
    mouKerjaSamaKeterangan: '',
    skCPCL: '',
    skCPCLKeterangan: '',
    laporanRealisasiPlasma: '',
    laporanRealisasiPlasmaKeterangan: '',
    
    // 3.7 Bukti Implementasi
    buktiGRTT: '',
    buktiGRTTKeterangan: '',
    buktiFPIC: '',
    buktiFPICKeterangan: '',
    suratMasukPermintaan: '',
    suratMasukPermintaanKeterangan: '',
    suratKeluarPermintaan: '',
    suratKeluarPermintaanKeterangan: '',
    suratMasukKeluhan: '',
    suratMasukKeluhanKeterangan: '',
    suratKeluarKeluhan: '',
    suratKeluarKeluhanKeterangan: '',
    
    // 3.8 Sengketa Lahan
    laporanSengketaLahan: '',
    laporanSengketaLahanKeterangan: '',
    
    // 3.9 Hak Buruh dan HAM
    komitmenHakBuruh: '',
    kebijakanHakBuruh: '',
    kebijakanHakBuruhKeterangan: '',
    sopKetenagakerjaan: '',
    sopKetenagakerjaanKeterangan: '',
    sopK3: '',
    sopK3Keterangan: '',
    
    // 3.10 Bukti Pelaksanaan HAM
    buktiPerjanjianKerja: '',
    buktiPerjanjianKerjaKeterangan: '',
    daftarKaryawan: '',
    daftarKaryawanKeterangan: '',
    skUMR: '',
    skUMRKeterangan: '',
    skSerikatPekerja: '',
    skSerikatPekerjaKeterangan: '',
    buktiBPJS: '',
    buktiBPJSKeterangan: '',
    laporanP2K3: '',
    laporanP2K3Keterangan: '',
    
    // 3.11 Perpajakan dan Antikorupsi
    komitmenAntikorupsi: '',
    kebijakanAntikorupsi: '',
    kebijakanAntikorupsiKeterangan: '',
    sopKodeEtik: '',
    sopKodeEtikKeterangan: '',
    saluranPengaduan: '',
    saluranPengaduanKeterangan: '',
    
    // 3.12 Bukti Pajak dan Ekspor
    suratTerdaftarPajak: '',
    suratTerdaftarPajakKeterangan: '',
    npwp: '',
    npwpKeterangan: '',
  });

  const createSupplierComplianceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-compliance', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      toast({
        title: "Data Supplier Compliance berhasil disimpan",
        description: "Data Kepatuhan Hukum Supplier telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data supplier compliance.",
        variant: "destructive",
      });
    },
  });

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects${uploadURL.split('/uploads')[1]}` : uploadURL;
      
      setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen untuk ${fieldName} telah berhasil diunggah.`,
      });
    }
  };

  // Dummy data for results table
  const dummySupplierComplianceData = [
    {
      id: 1,
      namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
      tingkatKepatuhan: 85,
      statusKepatuhan: 'Compliant',
      tanggalPenilaian: '15 November 2024',
      nomorTelefonTimInternal: '+62 811-2345-6789',
      emailKontak: 'compliance@kebun-sejahtera.co.id'
    },
    {
      id: 2,
      namaSupplier: 'CV Perkebunan Nusantara',
      tingkatKepatuhan: 92,
      statusKepatuhan: 'Highly Compliant',
      tanggalPenilaian: '18 November 2024',
      nomorTelefonTimInternal: '+62 812-3456-7890',
      emailKontak: 'legal@perkebunan-nusantara.co.id'
    },
    {
      id: 3,
      namaSupplier: 'Koperasi Tani Mandiri',
      tingkatKepatuhan: 68,
      statusKepatuhan: 'Partially Compliant',
      tanggalPenilaian: '20 November 2024',
      nomorTeleponTimInternal: '+62 813-4567-8901',
      emailKontak: 'koperasi@tani-mandiri.co.id'
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legality Compliance</h1>
          <p className="text-gray-600">
            Sistem penilaian kepatuhan hukum supplier untuk memastikan compliance dengan regulasi EUDR
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Hasil Penilaian</TabsTrigger>
          </TabsList>

          {/* Supplier Compliance Tab */}
          <TabsContent value="supplier-compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                <CardDescription>
                  (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupplierComplianceSubmit} className="space-y-8">
                  {/* Basic Information Section - Exact format from document */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Supplier :</Label>
                        <AutocompleteInput
                          value={supplierComplianceForm.namaSupplier}
                          onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: value }))}
                          suggestions={getSupplierSuggestions()}
                          placeholder="Pilih dari data yang tersedia atau ketik manual"
                          data-testid="input-nama-supplier"
                        />
                        {getSupplierSuggestions().length > 0 && (
                          <div className="text-xs text-blue-600">
                            💡 {getSupplierSuggestions().length} saran tersedia dari data collection
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Group / Parent Company Name :</Label>
                        <AutocompleteInput
                          value={supplierComplianceForm.namaGroup}
                          onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: value }))}
                          suggestions={getSupplierSuggestions()}
                          placeholder="Pilih dari data yang tersedia atau ketik manual"
                          data-testid="input-nama-group"
                        />
                        {getSupplierSuggestions().length > 0 && (
                          <div className="text-xs text-blue-600">
                            💡 {getSupplierSuggestions().length} saran tersedia dari data collection
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Pendirian Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPendirianPerusahaan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Perubahan (Jika Ada) :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPerubahan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Izin Berusaha (Nomor Induk Berusaha) :</Label>
                        <Input
                          value={supplierComplianceForm.izinBerusaha}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Tipe Sertifikat Yang Dimiliki Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.tipeSertifikat}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                          placeholder="(ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Alamat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                            rows={3}
                            placeholder="Pilih dari saran yang tersedia atau ketik manual"
                            data-testid="textarea-alamat-kantor"
                          />
                          {getAddressSuggestions().length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-blue-600">💡 Saran alamat:</span>
                              {getAddressSuggestions().slice(0, 3).map((addr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                  onClick={() => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: addr }))}
                                >
                                  {addr.length > 30 ? addr.substring(0, 30) + '...' : addr}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                            rows={3}
                            placeholder="Pilih dari saran yang tersedia atau ketik manual"
                            data-testid="textarea-alamat-kebun"
                          />
                          {getAddressSuggestions().length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-blue-600">💡 Saran alamat:</span>
                              {getAddressSuggestions().slice(0, 3).map((addr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                                  onClick={() => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: addr }))}
                                >
                                  {addr.length > 30 ? addr.substring(0, 30) + '...' : addr}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Koordinat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.koordinatKebun}
                            onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKebun: value }))}
                            suggestions={getCoordinateSuggestions()}
                            placeholder="Format: latitude, longitude atau pilih dari saran"
                            data-testid="input-koordinat-kebun"
                          />
                          {getCoordinateSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getCoordinateSuggestions().length} koordinat tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.koordinatKantor}
                            onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKantor: value }))}
                            suggestions={getCoordinateSuggestions()}
                            placeholder="Format: latitude, longitude atau pilih dari saran"
                            data-testid="input-koordinat-kantor"
                          />
                          {getCoordinateSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getCoordinateSuggestions().length} koordinat tersedia dari data collection
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium">Jenis supplier :</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="kkpa"
                            name="jenisSupplier"
                            value="kkpa"
                            checked={supplierComplianceForm.jenisSupplier === 'kkpa'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="kkpa">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="sister"
                            name="jenisSupplier"
                            value="sister"
                            checked={supplierComplianceForm.jenisSupplier === 'sister'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="sister">Kebun dalam satu grup manajemen (sister company)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="third-party"
                            name="jenisSupplier"
                            value="third-party"
                            checked={supplierComplianceForm.jenisSupplier === 'third-party'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="third-party">Kebun pihak ketiga (PT/ CV/ Koperasi)</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Penanggung Jawab</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.namaPenanggungJawab}
                            onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, namaPenanggungJawab: value }))}
                            suggestions={getContactPersonSuggestions()}
                            placeholder="Pilih dari data yang tersedia atau ketik manual"
                            data-testid="input-nama-penanggung-jawab"
                          />
                          {getContactPersonSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getContactPersonSuggestions().length} kontak tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                            data-testid="input-jabatan-penanggung-jawab"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTelefonPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <AutocompleteInput
                            value={supplierComplianceForm.namaTimInternal}
                            onChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, namaTimInternal: value }))}
                            suggestions={getContactPersonSuggestions()}
                            placeholder="Pilih dari data yang tersedia atau ketik manual"
                            data-testid="input-nama-tim-internal"
                          />
                          {getContactPersonSuggestions().length > 0 && (
                            <div className="text-xs text-blue-600">
                              💡 {getContactPersonSuggestions().length} kontak tersedia dari data collection
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                            data-testid="input-jabatan-tim-internal"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTeleponTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Legal Compliance Section */}
                  <div className="space-y-8">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-800">Legal Compliance</h3>
                      <p className="text-sm text-blue-600 mt-2">Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO</p>
                    </div>

                    {/* I. Hak Penggunaan Tanah */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">I. Hak Penggunaan Tanah</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Historis Perolehan Tanah</Label>
                        
                        {/* a. Izin Pencadangan Lahan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Pencadangan Lahan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-yes"
                                name="izinPencadanganLahan"
                                value="yes"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-no"
                                name="izinPencadanganLahan"
                                value="no"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinPencadanganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinPencadanganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. PKKPR / Izin Lokasi */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-yes"
                                name="persetujuanPKKPR"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-no"
                                name="persetujuanPKKPR"
                                value="no"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanPKKPRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'pkkprDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Izin Usaha Perkebunan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin Usaha Perkebunan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-yes"
                                name="izinUsahaPerkebunan"
                                value="yes"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-no"
                                name="izinUsahaPerkebunan"
                                value="no"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinUsahaPerkebunanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinUsahaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. SK HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. SK HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-yes"
                                name="skHGU"
                                value="yes"
                                checked={supplierComplianceForm.skHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-no"
                                name="skHGU"
                                value="no"
                                checked={supplierComplianceForm.skHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Sertifikat HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Sertifikat HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-yes"
                                name="sertifikatHGU"
                                value="yes"
                                checked={supplierComplianceForm.sertifikatHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-no"
                                name="sertifikatHGU"
                                value="no"
                                checked={supplierComplianceForm.sertifikatHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sertifikatHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sertifikatHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* f. Laporan Pemanfaatan HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">f. Laporan Pemanfaatan HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-yes"
                                name="laporanPemanfaatanHGU"
                                value="yes"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-no"
                                name="laporanPemanfaatanHGU"
                                value="no"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanPemanfaatanHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* g. Laporan Perkembangan Usaha Perkebunan (LPUP) */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">g. Laporan Perkembangan Usaha Perkebunan (LPUP)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-yes"
                                name="laporanLPUP"
                                value="yes"
                                checked={supplierComplianceForm.laporanLPUP === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-no"
                                name="laporanLPUP"
                                value="no"
                                checked={supplierComplianceForm.laporanLPUP === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanLPUPKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUPKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'lpupDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* II. Perlindungan Lingkungan Hidup */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">II. Perlindungan Lingkungan Hidup</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Perizinan Lingkungan Sesuai dengan Regulasi yang Relevan</Label>
                        
                        {/* a. Izin Lingkungan dan Dokumen Terkait */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Lingkungan dan Dokumen Terkait</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-yes"
                                name="izinLingkungan"
                                value="yes"
                                checked={supplierComplianceForm.izinLingkungan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-no"
                                name="izinLingkungan"
                                value="no"
                                checked={supplierComplianceForm.izinLingkungan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLingkunganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkunganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLingkunganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Izin / Rintek TPS Limbah B3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Izin / Rintek TPS Limbah B3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-yes"
                                name="izinRintekTPS"
                                value="yes"
                                checked={supplierComplianceForm.izinRintekTPS === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-no"
                                name="izinRintekTPS"
                                value="no"
                                checked={supplierComplianceForm.izinRintekTPS === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinRintekTPSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinRintekDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Izin / Pertek Pengelolaan Limbah Cair Industri */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin / Pertek Pengelolaan Limbah Cair Industri</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-yes"
                                name="izinLimbahCair"
                                value="yes"
                                checked={supplierComplianceForm.izinLimbahCair === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-no"
                                name="izinLimbahCair"
                                value="no"
                                checked={supplierComplianceForm.izinLimbahCair === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLimbahCairKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCairKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLimbahCairDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. Persetujuan Teknis ANDALALIN */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. Persetujuan Teknis ANDALALIN</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-yes"
                                name="persetujuanAndalalin"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-no"
                                name="persetujuanAndalalin"
                                value="no"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanAndalalinKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalinKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'andalalinDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Daftar pestisida dan izin edar yang masih berlaku */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Daftar pestisida dan izin edar yang masih berlaku</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-yes"
                                name="daftarPestisida"
                                value="yes"
                                checked={supplierComplianceForm.daftarPestisida === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-no"
                                name="daftarPestisida"
                                value="no"
                                checked={supplierComplianceForm.daftarPestisida === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.daftarPestisidaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisidaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'daftarPestisidaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Berikan Bukti Pelaksanaan prosedur */}
                        <div className="space-y-6 border-t pt-4 mt-6">
                          <Label className="font-medium text-blue-700">Berikan Bukti Pelaksanaan prosedur point II diatas</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-yes"
                                name="buktiPelaksanaanII"
                                value="yes"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-no"
                                name="buktiPelaksanaanII"
                                value="no"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-no">No</Label>
                            </div>
                          </div>

                          {/* a. Laporan Pelaksanaan RKL/RPL */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">a. Laporan Pelaksanaan RKL/RPL</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-yes"
                                  name="laporanRKLRPL"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-no"
                                  name="laporanRKLRPL"
                                  value="no"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanRKLRPLKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPLKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRKLRPLDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* b. Laporan Penggunaan Pestisida */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">b. Laporan Penggunaan Pestisida</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-yes"
                                  name="laporanPestisida"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanPestisida === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-no"
                                  name="laporanPestisida"
                                  value="no"
                                  checked={supplierComplianceForm.laporanPestisida === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanPestisidaKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisidaKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanPestisidaDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* III. Peraturan Kehutanan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">III. Peraturan Kehutanan</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah lokasi konsesi perkebunan berada di areal yang telah memperoleh pelepasan kawasan hutan atau di luar kawasan hutan sesuai dengan ketentuan peraturan perundang-undangan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-yes"
                              name="peraturanKehutanan"
                              value="yes"
                              checked={supplierComplianceForm.peraturanKehutanan === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-no"
                              name="peraturanKehutanan"
                              value="no"
                              checked={supplierComplianceForm.peraturanKehutanan === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.peraturanKehutananKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutananKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'peraturanKehutananDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IV. Hak Pihak Ke 3 termasuk Masyarakat Adat */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">IV. Hak Pihak Ke 3 termasuk Masyarakat Adat</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah dalam pembukaan atau pengembangan kebun kelapa sawit terdapat konflik dengan pihak ke 3 termasuk masyarakat adat</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-yes"
                              name="hakPihakKetiga"
                              value="yes"
                              checked={supplierComplianceForm.hakPihakKetiga === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-no"
                              name="hakPihakKetiga"
                              value="no"
                              checked={supplierComplianceForm.hakPihakKetiga === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.hakPihakKetigaKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetigaKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'hakPihakKetigaDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kewajiban Pengembangan Plasma */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Kewajiban Pengembangan Plasma minimun 20 % dari Lahan yang di Usahakan</h3>
                      <div className="space-y-4">
                        
                        {/* a. MoU Kerja sama */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. MoU Kerja sama</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="mouKerjasama-yes"
                                name="mouKerjasama"
                                value="yes"
                                checked={supplierComplianceForm.mouKerjasama === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasama: e.target.value }))}
                              />
                              <Label htmlFor="mouKerjasama-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="mouKerjasama-no"
                                name="mouKerjasama"
                                value="no"
                                checked={supplierComplianceForm.mouKerjasama === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasama: e.target.value }))}
                              />
                              <Label htmlFor="mouKerjasama-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.mouKerjasamaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, mouKerjasamaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'mouKerjasamaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SK CPCL */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SK CPCL (Calon Petani Calon Lahan)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skCPCL-yes"
                                name="skCPCL"
                                value="yes"
                                checked={supplierComplianceForm.skCPCL === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                              />
                              <Label htmlFor="skCPCL-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skCPCL-no"
                                name="skCPCL"
                                value="no"
                                checked={supplierComplianceForm.skCPCL === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCL: e.target.value }))}
                              />
                              <Label htmlFor="skCPCL-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skCPCLKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skCPCLKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skCPCLDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Laporan Realisasi Plasma */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Laporan Realisasi Plasma</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanRealisasiPlasma-yes"
                                name="laporanRealisasiPlasma"
                                value="yes"
                                checked={supplierComplianceForm.laporanRealisasiPlasma === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                              />
                              <Label htmlFor="laporanRealisasiPlasma-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanRealisasiPlasma-no"
                                name="laporanRealisasiPlasma"
                                value="no"
                                checked={supplierComplianceForm.laporanRealisasiPlasma === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasma: e.target.value }))}
                              />
                              <Label htmlFor="laporanRealisasiPlasma-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanRealisasiPlasmaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRealisasiPlasmaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRealisasiPlasmaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Implementasi Point 3.5 */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Bukti Implementasi Point 3.5</h3>
                      <div className="space-y-4">
                        
                        {/* a. Bukti GRTT */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Bukti GRTT (Jika Ada)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiGRTT-yes"
                                name="buktiGRTT"
                                value="yes"
                                checked={supplierComplianceForm.buktiGRTT === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTT: e.target.value }))}
                              />
                              <Label htmlFor="buktiGRTT-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiGRTT-no"
                                name="buktiGRTT"
                                value="no"
                                checked={supplierComplianceForm.buktiGRTT === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTT: e.target.value }))}
                              />
                              <Label htmlFor="buktiGRTT-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiGRTTKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiGRTTKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiGRTTDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Bukti FPIC */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Bukti FPIC (Jika Ada)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiFPIC-yes"
                                name="buktiFPIC"
                                value="yes"
                                checked={supplierComplianceForm.buktiFPIC === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPIC: e.target.value }))}
                              />
                              <Label htmlFor="buktiFPIC-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiFPIC-no"
                                name="buktiFPIC"
                                value="no"
                                checked={supplierComplianceForm.buktiFPIC === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPIC: e.target.value }))}
                              />
                              <Label htmlFor="buktiFPIC-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiFPICKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiFPICKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiFPICDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Penanganan Permintaan Informasi */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Penanganan Permintaan Informasi</Label>
                          
                          {/* 1) Surat Masuk */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">1) Surat Masuk</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukInformasi-yes"
                                  name="suratMasukInformasi"
                                  value="yes"
                                  checked={supplierComplianceForm.suratMasukInformasi === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukInformasi-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukInformasi-no"
                                  name="suratMasukInformasi"
                                  value="no"
                                  checked={supplierComplianceForm.suratMasukInformasi === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukInformasi-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratMasukInformasiKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukInformasiKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratMasukInformasiDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* 2) Surat Keluar */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">2) Surat Keluar</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarInformasi-yes"
                                  name="suratKeluarInformasi"
                                  value="yes"
                                  checked={supplierComplianceForm.suratKeluarInformasi === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarInformasi-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarInformasi-no"
                                  name="suratKeluarInformasi"
                                  value="no"
                                  checked={supplierComplianceForm.suratKeluarInformasi === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasi: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarInformasi-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratKeluarInformasiKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarInformasiKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratKeluarInformasiDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* d. Penanganan Keluhan Stakeholder */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. Penanganan Keluhan Stakeholder</Label>
                          
                          {/* 1) Surat Masuk */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">1) Surat Masuk</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukKeluhan-yes"
                                  name="suratMasukKeluhan"
                                  value="yes"
                                  checked={supplierComplianceForm.suratMasukKeluhan === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukKeluhan-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratMasukKeluhan-no"
                                  name="suratMasukKeluhan"
                                  value="no"
                                  checked={supplierComplianceForm.suratMasukKeluhan === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratMasukKeluhan-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratMasukKeluhanKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratMasukKeluhanKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratMasukKeluhanDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* 2) Surat Keluar */}
                          <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                            <Label className="font-medium">2) Surat Keluar</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarKeluhan-yes"
                                  name="suratKeluarKeluhan"
                                  value="yes"
                                  checked={supplierComplianceForm.suratKeluarKeluhan === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarKeluhan-yes">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="suratKeluarKeluhan-no"
                                  name="suratKeluarKeluhan"
                                  value="no"
                                  checked={supplierComplianceForm.suratKeluarKeluhan === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhan: e.target.value }))}
                                />
                                <Label htmlFor="suratKeluarKeluhan-no">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.suratKeluarKeluhanKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratKeluarKeluhanKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'suratKeluarKeluhanDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Laporan penyelesaian sengketa lahan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Laporan penyelesaian sengketa lahan (Jika Ada)</h3>
                      <div className="space-y-4">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanSengketaLahan-yes"
                              name="laporanSengketaLahan"
                              value="yes"
                              checked={supplierComplianceForm.laporanSengketaLahan === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahan: e.target.value }))}
                            />
                            <Label htmlFor="laporanSengketaLahan-yes">Ya</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="laporanSengketaLahan-no"
                              name="laporanSengketaLahan"
                              value="no"
                              checked={supplierComplianceForm.laporanSengketaLahan === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahan: e.target.value }))}
                            />
                            <Label htmlFor="laporanSengketaLahan-no">Tidak</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.laporanSengketaLahanKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanSengketaLahanKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'laporanSengketaLahanDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* V. Hak Buruh dan Hak Asasi Manusia */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">V. Hak Buruh dan Hak Asasi Manusia</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Jelaskan Komitmen Perusahaan Terhadap Hak Buruh dan Hak Asasi Pekerja</Label>
                        
                        {/* a. Kebijakan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Kebijakan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanHAM-yes"
                                name="kebijakanHAM"
                                value="yes"
                                checked={supplierComplianceForm.kebijakanHAM === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAM: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanHAM-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanHAM-no"
                                name="kebijakanHAM"
                                value="no"
                                checked={supplierComplianceForm.kebijakanHAM === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAM: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanHAM-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.kebijakanHAMKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHAMKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanHAMDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SOP/Mekanisme Ketenagakerjaan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SOP/Mekanisme yang berhubungan dengan Ketenagakerjaan</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <p>Seperti:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>SOP/Mekanisme Rekrutmen Karyawan</li>
                              <li>SOP/Mekanisme Penilaian Kinerja Karyawan</li>
                              <li>SOP/Mekanisme Promosi Karyawan</li>
                              <li>SOP/Mekanisme Pembayaran Upah</li>
                              <li>SOP/Mekanisme Insentif Kerja/Lembur</li>
                              <li>SOP/Mekanisme Cuti Karyawan</li>
                              <li>SOP/Mekanisme Penanganan Keluhan Karyawan</li>
                              <li>Dst.</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKetenagakerjaan-yes"
                                name="sopKetenagakerjaan"
                                value="yes"
                                checked={supplierComplianceForm.sopKetenagakerjaan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaan: e.target.value }))}
                              />
                              <Label htmlFor="sopKetenagakerjaan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKetenagakerjaan-no"
                                name="sopKetenagakerjaan"
                                value="no"
                                checked={supplierComplianceForm.sopKetenagakerjaan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaan: e.target.value }))}
                              />
                              <Label htmlFor="sopKetenagakerjaan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopKetenagakerjaanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKetenagakerjaanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopKetenagakerjaanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. SOP/Mekanisme K3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. SOP/Mekanisme yang berhubungan dengan K3</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <p>Seperti:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>SOP/Mekanisme Analisis Keselamatan Kerja</li>
                              <li>SOP/Mekanisme Panitia Pembina Keselamatan, Kesehatan Kerja dan Lingkungan</li>
                              <li>SOP/Mekanisme Pertolongan Pertama pada kecelakaan</li>
                              <li>SOP/Mekanisme Pelaporan dan Penyelidikan Kecelakaan Kerja</li>
                              <li>SOP/Mekanisme Inspeksi Pengelolaan Kerja</li>
                              <li>Dst.</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopK3-yes"
                                name="sopK3"
                                value="yes"
                                checked={supplierComplianceForm.sopK3 === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3: e.target.value }))}
                              />
                              <Label htmlFor="sopK3-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopK3-no"
                                name="sopK3"
                                value="no"
                                checked={supplierComplianceForm.sopK3 === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3: e.target.value }))}
                              />
                              <Label htmlFor="sopK3-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopK3Keterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopK3Keterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopK3Dokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Berikan Bukti Pelaksanaan prosedur point 3.9 */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Berikan Bukti Pelaksanaan prosedur point 3.9 diatas</h3>
                      <div className="space-y-4">
                        
                        {/* a. Bukti Pencatatan perjanjian kerja ke DISNAKER */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Bukti Pencatatan perjanjian kerja ke DISNAKER</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiDisnaker-yes"
                                name="buktiDisnaker"
                                value="yes"
                                checked={supplierComplianceForm.buktiDisnaker === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnaker: e.target.value }))}
                              />
                              <Label htmlFor="buktiDisnaker-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiDisnaker-no"
                                name="buktiDisnaker"
                                value="no"
                                checked={supplierComplianceForm.buktiDisnaker === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnaker: e.target.value }))}
                              />
                              <Label htmlFor="buktiDisnaker-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiDisnakerKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiDisnakerKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiDisnakerDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Daftar Karyawan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Daftar Karyawan, Mencakup:</Label>
                          <div className="text-sm text-gray-600 mb-4">
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Nama</li>
                              <li>Tempat, Tanggal Lahir</li>
                              <li>Jenis Kelamin</li>
                            </ul>
                          </div>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarKaryawan-yes"
                                name="daftarKaryawan"
                                value="yes"
                                checked={supplierComplianceForm.daftarKaryawan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawan: e.target.value }))}
                              />
                              <Label htmlFor="daftarKaryawan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarKaryawan-no"
                                name="daftarKaryawan"
                                value="no"
                                checked={supplierComplianceForm.daftarKaryawan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawan: e.target.value }))}
                              />
                              <Label htmlFor="daftarKaryawan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.daftarKaryawanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarKaryawanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'daftarKaryawanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. SK UMR / Penggajian */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. SK UMR / Penggajian</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skUMR-yes"
                                name="skUMR"
                                value="yes"
                                checked={supplierComplianceForm.skUMR === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMR: e.target.value }))}
                              />
                              <Label htmlFor="skUMR-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skUMR-no"
                                name="skUMR"
                                value="no"
                                checked={supplierComplianceForm.skUMR === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMR: e.target.value }))}
                              />
                              <Label htmlFor="skUMR-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skUMRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skUMRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skUMRDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. SK Pembentukan Serikat Pekerja */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. SK Pembentukan dan atau SK Pengesahan Serikat Pekerja / SK LKS Bipartit (Jika Tidak ada Serikat)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skSerikatPekerja-yes"
                                name="skSerikatPekerja"
                                value="yes"
                                checked={supplierComplianceForm.skSerikatPekerja === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerja: e.target.value }))}
                              />
                              <Label htmlFor="skSerikatPekerja-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skSerikatPekerja-no"
                                name="skSerikatPekerja"
                                value="no"
                                checked={supplierComplianceForm.skSerikatPekerja === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerja: e.target.value }))}
                              />
                              <Label htmlFor="skSerikatPekerja-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skSerikatPekerjaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skSerikatPekerjaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skSerikatPekerjaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Bukti Terdaftar BPJS */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Bukti Terdaftar BPJS TK dan Kesehatan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiBPJS-yes"
                                name="buktiBPJS"
                                value="yes"
                                checked={supplierComplianceForm.buktiBPJS === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJS: e.target.value }))}
                              />
                              <Label htmlFor="buktiBPJS-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiBPJS-no"
                                name="buktiBPJS"
                                value="no"
                                checked={supplierComplianceForm.buktiBPJS === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJS: e.target.value }))}
                              />
                              <Label htmlFor="buktiBPJS-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.buktiBPJSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiBPJSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'buktiBPJSDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* f. Laporan P2K3 / Sertifikat SMK3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">f. Laporan P2K3 / Sertifikat SMK3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanP2K3-yes"
                                name="laporanP2K3"
                                value="yes"
                                checked={supplierComplianceForm.laporanP2K3 === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3: e.target.value }))}
                              />
                              <Label htmlFor="laporanP2K3-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanP2K3-no"
                                name="laporanP2K3"
                                value="no"
                                checked={supplierComplianceForm.laporanP2K3 === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3: e.target.value }))}
                              />
                              <Label htmlFor="laporanP2K3-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanP2K3Keterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanP2K3Keterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanP2K3Dokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VI. Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">VI. Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Jelaskan Komitmen Perusahaan Terhadap Kebijakan Terkait Peraturan Perpajakan, Antikorupsi, perdagangan dan Bea Cukai</Label>
                        
                        {/* a. Kebijakan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Kebijakan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanPerpajakan-yes"
                                name="kebijakanPerpajakan"
                                value="yes"
                                checked={supplierComplianceForm.kebijakanPerpajakan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakan: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanPerpajakan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="kebijakanPerpajakan-no"
                                name="kebijakanPerpajakan"
                                value="no"
                                checked={supplierComplianceForm.kebijakanPerpajakan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakan: e.target.value }))}
                              />
                              <Label htmlFor="kebijakanPerpajakan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.kebijakanPerpajakanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanPerpajakanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'kebijakanPerpajakanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. SOP/Mekanisme Kode Etik Bisnis */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. SOP/Mekanisme yang berhubungan dengan Kode etik bisnis (Penanganan Laporan Terkait dengan Kode Etik Bisnis seperti: Korupsi, Kolusi)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKodeEtikBisnis-yes"
                                name="sopKodeEtikBisnis"
                                value="yes"
                                checked={supplierComplianceForm.sopKodeEtikBisnis === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnis: e.target.value }))}
                              />
                              <Label htmlFor="sopKodeEtikBisnis-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sopKodeEtikBisnis-no"
                                name="sopKodeEtikBisnis"
                                value="no"
                                checked={supplierComplianceForm.sopKodeEtikBisnis === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnis: e.target.value }))}
                              />
                              <Label htmlFor="sopKodeEtikBisnis-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sopKodeEtikBisnisKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sopKodeEtikBisnisKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sopKodeEtikBisnisDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Saluran Pengaduan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Saluran Pengaduan yang dapat diakses Publik</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="saluranPengaduan-yes"
                                name="saluranPengaduan"
                                value="yes"
                                checked={supplierComplianceForm.saluranPengaduan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduan: e.target.value }))}
                              />
                              <Label htmlFor="saluranPengaduan-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="saluranPengaduan-no"
                                name="saluranPengaduan"
                                value="no"
                                checked={supplierComplianceForm.saluranPengaduan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduan: e.target.value }))}
                              />
                              <Label htmlFor="saluranPengaduan-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.saluranPengaduanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, saluranPengaduanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'saluranPengaduanDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Terdaftar Pajak dan pemenuhan persyaratan eksport */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">Bukti Terdaftar Pajak dan pemenuhan persyaratan eksport</h3>
                      <div className="space-y-4">
                        
                        {/* a. Surat keterangan Terdaftar Pajak */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Surat keterangan Terdaftar Pajak</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="suratTerdaftarPajak-yes"
                                name="suratTerdaftarPajak"
                                value="yes"
                                checked={supplierComplianceForm.suratTerdaftarPajak === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajak: e.target.value }))}
                              />
                              <Label htmlFor="suratTerdaftarPajak-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="suratTerdaftarPajak-no"
                                name="suratTerdaftarPajak"
                                value="no"
                                checked={supplierComplianceForm.suratTerdaftarPajak === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajak: e.target.value }))}
                              />
                              <Label htmlFor="suratTerdaftarPajak-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.suratTerdaftarPajakKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, suratTerdaftarPajakKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'suratTerdaftarPajakDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. NPWP */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. NPWP</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="npwp-yes"
                                name="npwp"
                                value="yes"
                                checked={supplierComplianceForm.npwp === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwp: e.target.value }))}
                              />
                              <Label htmlFor="npwp-yes">Ya</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="npwp-no"
                                name="npwp"
                                value="no"
                                checked={supplierComplianceForm.npwp === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwp: e.target.value }))}
                              />
                              <Label htmlFor="npwp-no">Tidak</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.npwpKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, npwpKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'npwpDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                                maxNumberOfFiles={10}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-supplier-compliance"
                      className="w-full" 
                      disabled={createSupplierComplianceMutation.isPending}
                    >
                      {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Penilaian Kepatuhan Supplier</CardTitle>
                <CardDescription>
                  Daftar supplier yang telah dinilai tingkat kepatuhannya terhadap regulasi hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tingkat Kepatuhan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Penilaian</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dummySupplierComplianceData.map((compliance) => (
                        <TableRow key={compliance.id}>
                          <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                    compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                              {compliance.statusKepatuhan}
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.tanggalPenilaian}</TableCell>
                          <TableCell className="text-sm">
                            <div>{compliance.nomorTelefonTimInternal}</div>
                            <div className="text-muted-foreground">{compliance.emailKontak}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
