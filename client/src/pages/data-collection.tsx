import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { FileText, Upload, Satellite, Plus, Trash2 } from 'lucide-react';
import type { UploadResult } from '@uppy/core';

export default function DataCollection() {
  const [supplierType, setSupplierType] = useState('');
  const { toast } = useToast();

  // Form states for all collection types
  const [estateForm, setEstateForm] = useState({
    // Bagian 1 - Informasi Umum
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '', // document URL
    aktaPerubahan: '', // document URL (Jika Ada)
    izinBerusaha: '', // Nomor Induk Berusaha
    
    // Alamat
    alamatKantor: '',
    alamatKebun: '',
    
    // Koordinat
    koordinatKebun: '',
    koordinatKantor: '',
    
    // Jenis supplier dengan opsi yang tepat dari dokumen
    jenisSupplier: '', // Kebun plasma yang dikelola penuh oleh perusahaan (KKPA), Kebun dalam satu grup manajemen (sister company), Kebun pihak ketiga (PT/ CV/ Koperasi)
    totalProduksiTBSTahun: '', // kurun 1 tahun terakhir
    
    // Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tanda Tangan
    tandaTangan: '',
    tempatTanggal: '',
    
    // Bagian 2 - Sumber TBS (Daftar Kebun)
    daftarKebun: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      koordinatLongitude: '',
      koordinatLatitude: '',
      polygonKebun: '',
      luasLahan: '', // Ha
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS1TahunTerakhir: ''
    }]
  });

  const [smallholdersForm, setSmallholdersForm] = useState({
    // Form Kemampuan Telusur (Traceability) TBS Luar
    nomorDO: '',
    pemegangDO: '',
    alamatPemegangDO: '',
    lokasiUsaha: '', // Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu
    
    // Legalitas Pemegang DO
    aktaPendirianUsaha: '', // document URL - Jika Berbadan Hukum
    nib: '',
    npwp: '',
    
    luasLahanTertanamPetaniSupplier: '',
    volumeTBS: '',
    
    // Daftar Petani Pemasok TBS
    daftarPetaniPemasokTBS: [{
      no: 1,
      namaPetani: '',
      alamatTempatTinggal: '',
      lokasiKebun: '',
      luas: '', // Ha
      // Legalitas Lahan
      stdb: '', // document URL
      sppl: '', // document URL
      nomorObjekPajakPBB: '',
      longitude: '',
      latitude: '',
      polygon: '',
      tahunTanam: ''
    }]
  });

  const [millForm, setMillForm] = useState({
    // Bagian 1 - Informasi Umum
    umlId: '',
    namaPabrik: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    
    // Alamat
    alamatKantor: '',
    alamatPabrik: '',
    
    // Koordinat
    koordinatPabrik: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    kuantitasCPOPK: '', // M/T
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  const [kcpForm, setKcpForm] = useState({
    ublFacilityId: '',
    namaKCP: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatKCP: '',
    koordinatKantor: '',
    koordinatKCP: '',
    modelChainOfCustody: '',
    kapasitasOlahMTHari: 0,
    kapasitasOlah: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  const [bulkingForm, setBulkingForm] = useState({
    ublFacilityId: '',
    namaFasilitasBulking: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatBulking: '',
    modelChainOfCustody: '',
    kapasitasTotal: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/estate-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      toast({
        title: "Data Estate berhasil disimpan",
        description: "Data Estate telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setEstateForm({
        namaSupplier: '', namaGroup: '', aktaPendirianPerusahaan: '', aktaPerubahan: '', izinBerusaha: '',
        alamatKantor: '', alamatKebun: '', koordinatKebun: '', koordinatKantor: '', jenisSupplier: '', 
        totalProduksiTBSTahun: '', namaTimInternal: '', jabatanTimInternal: '', emailTimInternal: '', 
        nomorTeleponTimInternal: '', namaPenanggungJawab: '', jabatanPenanggungJawab: '', emailPenanggungJawab: '', 
        nomorTelefonPenanggungJawab: '', tandaTangan: '', tempatTanggal: '', 
        daftarKebun: [{ no: 1, namaKebun: '', alamat: '', koordinatLongitude: '', koordinatLatitude: '', 
        polygonKebun: '', luasLahan: '', tahunTanam: '', jenisBibit: '', produksiTBS1TahunTerakhir: '' }]
      });
    },
  });

  const createSmallholdersMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/traceability-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/traceability-data-collection'] });
      toast({
        title: "Data Smallholders berhasil disimpan",
        description: "Data Smallholders telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setSmallholdersForm({
        nomorDO: '', pemegangDO: '', alamatPemegangDO: '', lokasiUsaha: '', aktaPendirianUsaha: '',
        nib: '', npwp: '', luasLahanTertanamPetaniSupplier: '', volumeTBS: '',
        daftarPetaniPemasokTBS: [{ no: 1, namaPetani: '', alamatTempatTinggal: '', lokasiKebun: '', luas: '', stdb: '', sppl: '', nomorObjekPajakPBB: '', longitude: '', latitude: '', polygon: '', tahunTanam: '' }]
      });
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Data Mill berhasil disimpan",
        description: "Data Mill telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createKcpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/kcp-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kcp-data-collection'] });
      toast({
        title: "Data KCP berhasil disimpan",
        description: "Data KCP telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createBulkingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bulking-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulking-data-collection'] });
      toast({
        title: "Data Bulking berhasil disimpan",
        description: "Data Bulking telah berhasil disimpan ke sistem.",
      });
    },
  });

  // Document upload functionality
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST');
      return {
        method: 'PUT' as const,
        url: response.url || response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string,
    formType: 'estate' | 'mill' | 'smallholders' | 'kcp' | 'bulking'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'mill') {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'smallholders') {
        setSmallholdersForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'kcp') {
        setKcpForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'bulking') {
        setBulkingForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  // Note: Kebun management moved to Spatial Analysis step

  // Add Pemasok function
  const addPemasok = () => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasokTBS: [
        ...prev.daftarPetaniPemasokTBS,
        {
          no: prev.daftarPetaniPemasokTBS.length + 1,
          namaPetani: '',
          alamatTempatTinggal: '',
          lokasiKebun: '',
          luas: '',
          stdb: '',
          sppl: '',
          nomorObjekPajakPBB: '',
          longitude: '',
          latitude: '',
          polygon: '',
          tahunTanam: ''
        }
      ]
    }));
  };

  // Remove Pemasok function
  const removePemasok = (index: number) => {
    setSmallholdersForm(prev => ({
      ...prev,
      daftarPetaniPemasokTBS: prev.daftarPetaniPemasokTBS.filter((_, i) => i !== index).map((pemasok, i) => ({ ...pemasok, no: i + 1 }))
    }));
  };

  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEstateMutation.mutate(estateForm);
  };

  const handleSmallholdersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSmallholdersMutation.mutate(smallholdersForm);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMillMutation.mutate(millForm);
  };

  const handleKcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKcpMutation.mutate(kcpForm);
  };

  const handleBulkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBulkingMutation.mutate(bulkingForm);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 data-testid="text-page-title" className="text-3xl font-bold">
            Data Collection
          </h1>
          <p data-testid="text-page-description" className="text-muted-foreground mt-2">
            Sistem pengumpulan data komprehensif untuk kepatuhan EUDR dengan kemampuan unggah dokumen
          </p>
        </div>

        {/* Supplier Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Supplier Type</CardTitle>
            <CardDescription>
              Choose the supplier type to display the relevant data collection form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={supplierType} onValueChange={setSupplierType}>
              <SelectTrigger className="w-full max-w-md" data-testid="select-supplier-type">
                <SelectValue placeholder="Select supplier type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="mill">Mill</SelectItem>
                <SelectItem value="smallholders">Smallholders</SelectItem>
                <SelectItem value="kcp">KCP</SelectItem>
                <SelectItem value="bulking">Bulking</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Conditional Form Rendering */}
        {supplierType === 'estate' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Estate</CardTitle>
              <CardDescription>
                (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEstateSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaSupplier">Nama Supplier <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaSupplier"
                        data-testid="input-nama-supplier-estate"
                        value={estateForm.namaSupplier}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        placeholder="Masukkan nama supplier"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-estate"
                        value={estateForm.namaGroup}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group/parent company"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha) <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-estate"
                        value={estateForm.izinBerusaha}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jenisKebun">Jenis Kebun</Label>
                      <Select
                        value={estateForm.jenisKebun}
                        onValueChange={(value) => setEstateForm(prev => ({ ...prev, jenisKebun: value }))}
                      >
                        <SelectTrigger data-testid="select-jenis-kebun-estate">
                          <SelectValue placeholder="Pilih jenis kebun..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kebun-sendiri">Kebun Sendiri</SelectItem>
                          <SelectItem value="kebun-satu-manajemen">Kebun Satu Manajemen Pengelolaan</SelectItem>
                          <SelectItem value="third-partied">Third-Partied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatKebun">Alamat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Textarea
                        id="alamatKebun"
                        data-testid="input-alamat-kebun-estate"
                        value={estateForm.alamatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                        placeholder="Masukkan alamat kebun lengkap"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKebun">Koordinat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="koordinatKebun"
                        data-testid="input-koordinat-kebun-estate"
                        value={estateForm.koordinatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                        placeholder="Latitude, Longitude"
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Pendukung</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianPerusahaan', 'estate')}
                        />
                        {estateForm.aktaPendirianPerusahaan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Perubahan</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'estate')}
                        />
                        {estateForm.aktaPerubahan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2 – Sumber TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Sumber TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">No</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Nama Kebun</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Alamat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Koordinat *</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Luas Lahan (Ha)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Tahun Tanam</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Jenis Bibit</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Produksi TBS 1 Tahun Terakhir</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Actions</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>Longitude</span>
                                <span>Latitude</span>
                                <span>Polygon Kebun</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {estateForm.daftarKebun.map((kebun, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                <span className="text-sm">{kebun.no}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.namaKebun}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].namaKebun = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Nama kebun"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={kebun.alamat}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].alamat = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Alamat"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={kebun.koordinatLongitude}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].koordinatLongitude = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Long"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={kebun.koordinatLatitude}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].koordinatLatitude = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Lat"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={kebun.polygonKebun}
                                    onChange={(e) => {
                                      const newDaftarKebun = [...estateForm.daftarKebun];
                                      newDaftarKebun[index].polygonKebun = e.target.value;
                                      setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                    }}
                                    placeholder="Polygon"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.luasLahan}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].luasLahan = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Luas (Ha)"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.tahunTanam}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].tahunTanam = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Tahun tanam"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.jenisBibit}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].jenisBibit = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Jenis bibit"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={kebun.produksiTBS1TahunTerakhir}
                                  onChange={(e) => {
                                    const newDaftarKebun = [...estateForm.daftarKebun];
                                    newDaftarKebun[index].produksiTBS1TahunTerakhir = e.target.value;
                                    setEstateForm(prev => ({ ...prev, daftarKebun: newDaftarKebun }));
                                  }}
                                  placeholder="Produksi TBS"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                {estateForm.daftarKebun.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newDaftarKebun = estateForm.daftarKebun.filter((_, i) => i !== index);
                                      // Re-number the remaining items
                                      const renumberedKebun = newDaftarKebun.map((item, i) => ({ ...item, no: i + 1 }));
                                      setEstateForm(prev => ({ ...prev, daftarKebun: renumberedKebun }));
                                    }}
                                    className="text-xs"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEstateForm(prev => ({
                          ...prev,
                          daftarKebun: [
                            ...prev.daftarKebun,
                            {
                              no: prev.daftarKebun.length + 1,
                              namaKebun: '',
                              alamat: '',
                              koordinatLongitude: '',
                              koordinatLatitude: '',
                              polygonKebun: '',
                              luasLahan: '',
                              tahunTanam: '',
                              jenisBibit: '',
                              produksiTBS1TahunTerakhir: ''
                            }
                          ]
                        }));
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Kebun
                    </Button>

                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Keterangan:</strong> *) Jika lebih &gt; 4Ha data Polygon (SHP/GeoJSON)
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createEstateMutation.isPending} data-testid="button-submit-estate">
                    {createEstateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Estate'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'smallholders' && (
          <Card>
            <CardHeader>
              <CardTitle>Form Kemampuan Telusur (Traceability) TBS Luar</CardTitle>
              <CardDescription>
                (Unit Usaha Kecil Menengah/Small Medium Enterprise)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmallholdersSubmit} className="space-y-8">
                {/* Basic Information Fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomorDO">1. Nomor DO</Label>
                      <Input
                        id="nomorDO"
                        data-testid="input-nomor-do-smallholders"
                        value={smallholdersForm.nomorDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nomorDO: e.target.value }))}
                        placeholder="Masukkan nomor DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pemegangDO">2. Pemegang DO</Label>
                      <Input
                        id="pemegangDO"
                        data-testid="input-pemegang-do-smallholders"
                        value={smallholdersForm.pemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, pemegangDO: e.target.value }))}
                        placeholder="Masukkan pemegang DO"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatPemegangDO">3. Alamat Pemegang DO</Label>
                      <Textarea
                        id="alamatPemegangDO"
                        data-testid="input-alamat-pemegang-do-smallholders"
                        value={smallholdersForm.alamatPemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, alamatPemegangDO: e.target.value }))}
                        placeholder="Masukkan alamat pemegang DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lokasiUsaha">4. Lokasi Usaha</Label>
                      <Textarea
                        id="lokasiUsaha"
                        data-testid="input-lokasi-usaha-smallholders"
                        value={smallholdersForm.lokasiUsaha}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, lokasiUsaha: e.target.value }))}
                        placeholder="( Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu  )"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium mt-6">5. Legalitas Pemegang DO</h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nib">NIB</Label>
                      <Input
                        id="nib"
                        data-testid="input-nib-smallholders"
                        value={smallholdersForm.nib}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nib: e.target.value }))}
                        placeholder="Masukkan NIB"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="npwp">NPWP</Label>
                      <Input
                        id="npwp"
                        data-testid="input-npwp-smallholders"
                        value={smallholdersForm.npwp}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, npwp: e.target.value }))}
                        placeholder="Masukkan NPWP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="luasLahanTertanamPetaniSupplier">6. Luas Lahan Tertanam Petani Supplier</Label>
                      <Input
                        id="luasLahanTertanamPetaniSupplier"
                        data-testid="input-luas-lahan-tertanam-smallholders"
                        value={smallholdersForm.luasLahanTertanamPetaniSupplier}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, luasLahanTertanamPetaniSupplier: e.target.value }))}
                        placeholder="Masukkan luas lahan tertanam"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volumeTBS">7. Volume TBS</Label>
                      <Input
                        id="volumeTBS"
                        data-testid="input-volume-tbs-smallholders"
                        value={smallholdersForm.volumeTBS}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, volumeTBS: e.target.value }))}
                        placeholder="Masukkan volume TBS"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Legalitas</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian Usaha ( Jika Berbadan Hukum)</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianUsaha', 'smallholders')}
                        />
                        {smallholdersForm.aktaPendirianUsaha && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Daftar Petani Pemasok TBS */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">6. Daftar Petani Pemasok TBS</h3>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">No.</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Nama Petani</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Alamat Tempat Tinggal</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Lokasi Kebun</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Luas (Ha)</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Legalitas Lahan</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Tahun Tanam</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Koordinat</th>
                            <th className="border border-gray-300 px-2 py-2 text-xs font-medium">Actions</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>STDB</span>
                                <span>SPPL</span>
                                <span>Nomor Objek Pajak PBB</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                            <th className="border border-gray-300 px-1 py-1 text-xs font-medium">
                              <div className="grid grid-cols-3 gap-1">
                                <span>Longitude</span>
                                <span>Latitude</span>
                                <span>Polygon</span>
                              </div>
                            </th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {smallholdersForm.daftarPetaniPemasokTBS.map((petani, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                <span className="text-sm">{petani.no}</span>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.namaPetani}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].namaPetani = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Nama petani"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={petani.alamatTempatTinggal}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].alamatTempatTinggal = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Alamat tempat tinggal"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Textarea
                                  value={petani.lokasiKebun}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].lokasiKebun = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Lokasi kebun"
                                  className="text-sm min-h-[60px]"
                                />
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.luas}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].luas = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Luas (Ha)"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={petani.stdb}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].stdb = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="STDB"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.sppl}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].sppl = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="SPPL"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.nomorObjekPajakPBB}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].nomorObjekPajakPBB = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="No Pajak PBB"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2">
                                <Input
                                  value={petani.tahunTanam}
                                  onChange={(e) => {
                                    const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                    newDaftarPetani[index].tahunTanam = e.target.value;
                                    setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                  }}
                                  placeholder="Tahun tanam"
                                  className="text-sm"
                                />
                              </td>
                              <td className="border border-gray-300 px-1 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <Input
                                    value={petani.longitude}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].longitude = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Long"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.latitude}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].latitude = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Lat"
                                    className="text-xs"
                                  />
                                  <Input
                                    value={petani.polygon}
                                    onChange={(e) => {
                                      const newDaftarPetani = [...smallholdersForm.daftarPetaniPemasokTBS];
                                      newDaftarPetani[index].polygon = e.target.value;
                                      setSmallholdersForm(prev => ({ ...prev, daftarPetaniPemasokTBS: newDaftarPetani }));
                                    }}
                                    placeholder="Polygon"
                                    className="text-xs"
                                  />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {smallholdersForm.daftarPetaniPemasokTBS.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => removePemasok(index)} 
                                    data-testid={`button-remove-pemasok-${index}`}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button type="button" onClick={addPemasok} variant="outline" data-testid="button-add-pemasok">
                        <Plus size={16} className="mr-2" />
                        Tambah Petani Pemasok
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createSmallholdersMutation.isPending} data-testid="button-submit-smallholders">
                    {createSmallholdersMutation.isPending ? 'Menyimpan...' : 'Simpan Data Smallholders'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'mill' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Mill</CardTitle>
              <CardDescription>
                (Pabrik Kelapa Sawit)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMillSubmit} className="space-y-8">
                {/* Basic Mill Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar Mill</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaPabrik">Nama Pabrik <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaPabrik"
                        data-testid="input-nama-pabrik-mill"
                        value={millForm.namaPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                        placeholder="Masukkan nama pabrik"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kuantitasCPOPK">Kuantitas CPO/PK <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="kuantitasCPOPK"
                        data-testid="input-kuantitas-cpo-pk-mill"
                        value={millForm.kuantitasCPOPK}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kuantitasCPOPK: e.target.value }))}
                        placeholder="Masukkan kuantitas dalam M/T"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createMillMutation.isPending} data-testid="button-submit-mill">
                    {createMillMutation.isPending ? 'Menyimpan...' : 'Simpan Data Mill'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'kcp' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data KCP</CardTitle>
              <CardDescription>
                (Kernel Crushing Plant)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleKcpSubmit} className="space-y-8">
                {/* Basic KCP Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar KCP</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaKCP">Nama KCP <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaKCP"
                        data-testid="input-nama-kcp"
                        value={kcpForm.namaKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaKCP: e.target.value }))}
                        placeholder="Masukkan nama KCP"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasOlahMTHari">Kapasitas Olah (MT/Hari)</Label>
                      <Input
                        id="kapasitasOlahMTHari"
                        type="number"
                        data-testid="input-kapasitas-olah-kcp"
                        value={kcpForm.kapasitasOlahMTHari}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlahMTHari: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createKcpMutation.isPending} data-testid="button-submit-kcp">
                    {createKcpMutation.isPending ? 'Menyimpan...' : 'Simpan Data KCP'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'bulking' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Bulking</CardTitle>
              <CardDescription>
                (Fasilitas Bulking/Storage)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkingSubmit} className="space-y-8">
                {/* Basic Bulking Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar Bulking</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaFasilitasBulking">Nama Fasilitas Bulking</Label>
                      <Input
                        id="namaFasilitasBulking"
                        data-testid="input-nama-fasilitas-bulking"
                        value={bulkingForm.namaFasilitasBulking}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaFasilitasBulking: e.target.value }))}
                        placeholder="Masukkan nama fasilitas"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasTotal">Kapasitas Total (MT)</Label>
                      <Input
                        id="kapasitasTotal"
                        type="number"
                        data-testid="input-kapasitas-total-bulking"
                        value={bulkingForm.kapasitasTotal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, kapasitasTotal: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas total"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createBulkingMutation.isPending} data-testid="button-submit-bulking">
                    {createBulkingMutation.isPending ? 'Menyimpan...' : 'Simpan Data Bulking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* View Consolidated Results CTA - Show when any supplier type is selected */}
        {supplierType && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    View Consolidated Assessment Results
                  </h3>
                  <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                    Review comprehensive supplier assessments with AI-powered analysis, compliance scoring, and risk evaluation across all your data collection efforts.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/supply-chain-analysis'}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
                  data-testid="button-view-consolidated-results"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Consolidated Results & Analysis
                  <span className="ml-2">→</span>
                </Button>
                <p className="text-sm text-blue-600 mt-2">
                  Access detailed reports, compliance status, and risk assessments
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}